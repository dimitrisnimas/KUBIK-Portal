using KubikPortal.Api.Data;
using KubikPortal.Api.Domain;
using KubikPortal.Api.Infrastructure;
using Microsoft.EntityFrameworkCore;

namespace KubikPortal.Api.Features.Tickets;

public static class TicketEndpoints
{
    public static RouteGroupBuilder MapTicketEndpoints(this RouteGroupBuilder api)
    {
        var tickets = api.MapGroup("/tickets").RequireAuthorization();
        tickets.MapGet("/", GetTicketsAsync);
        tickets.MapGet("/{id:guid}", GetTicketAsync);
        tickets.MapPost("/", CreateTicketAsync)
            .RequireAuthorization(policy => policy.RequireRole(DemoRole.Client.ToString()))
            .AddEndpointFilter<AntiforgeryEndpointFilter>();
        tickets.MapPost("/{id:guid}/messages", AddMessageAsync).AddEndpointFilter<AntiforgeryEndpointFilter>();

        var admin = api.MapGroup("/admin/tickets")
            .RequireAuthorization(policy => policy.RequireRole(DemoRole.Administrator.ToString()));
        admin.MapPatch("/{id:guid}/status", UpdateStatusAsync).AddEndpointFilter<AntiforgeryEndpointFilter>();
        admin.MapPost("/{id:guid}/billing-decisions", AddBillingDecisionAsync).AddEndpointFilter<AntiforgeryEndpointFilter>();
        return api;
    }

    private static async Task<IResult> GetTicketsAsync(
        HttpContext context, PortalDbContext db, WorkspaceContext workspaceContext, CancellationToken cancellationToken)
    {
        var query = db.SupportTickets.AsNoTracking();
        if (!IsAdmin(context)) query = query.Where(x => x.OwnerPersonaId == workspaceContext.PersonaId);
        var records = await query.Include(x => x.ManagedAsset).Include(x => x.Messages).Include(x => x.BillingDecisions)
            .AsSplitQuery().OrderByDescending(x => x.UpdatedAt).ToListAsync(cancellationToken);
        return Results.Ok(records.Select(TicketSummaryResponse.From));
    }

    private static async Task<IResult> GetTicketAsync(
        Guid id, HttpContext context, PortalDbContext db, WorkspaceContext workspaceContext, CancellationToken cancellationToken)
    {
        var ticket = await VisibleTicket(db, context, workspaceContext, id)
            .AsNoTracking()
            .Include(x => x.ManagedAsset).Include(x => x.OwnerPersona)
            .Include(x => x.Messages).ThenInclude(x => x.AuthorPersona)
            .Include(x => x.BillingDecisions).ThenInclude(x => x.ReviewerPersona)
            .AsSplitQuery().SingleOrDefaultAsync(cancellationToken);
        return ticket is null ? Results.NotFound() : Results.Ok(TicketDetailResponse.From(ticket));
    }

    private static async Task<IResult> CreateTicketAsync(
        TicketCreateRequest request, PortalDbContext db, WorkspaceContext workspaceContext, CancellationToken cancellationToken)
    {
        if (ValidateTitle(request.Title) is { } titleError) return titleError;
        if (ValidateMessage(request.Message) is { } messageError) return messageError;
        if (!Enum.IsDefined(request.Kind)) return Invalid("kind", "Ο τύπος αιτήματος δεν είναι έγκυρος.");
        if (!Enum.IsDefined(request.Priority)) return Invalid("priority", "Η προτεραιότητα δεν είναι έγκυρη.");
        if (request.ManagedAssetId is Guid assetId && !await db.ManagedAssets.AnyAsync(
                x => x.Id == assetId && x.OwnerPersonaId == workspaceContext.PersonaId, cancellationToken))
            return Invalid("managedAssetId", "Το επιλεγμένο έργο δεν είναι διαθέσιμο.");

        var now = DateTimeOffset.UtcNow;
        var ticketId = Guid.CreateVersion7();
        var ticket = new SupportTicket
        {
            Id = ticketId, WorkspaceId = workspaceContext.WorkspaceId!.Value, OwnerPersonaId = workspaceContext.PersonaId!.Value,
            ManagedAssetId = request.ManagedAssetId, Number = $"K-{ticketId.ToString("N")[..8].ToUpperInvariant()}",
            Title = request.Title!.Trim(), Kind = request.Kind, Priority = request.Priority, Status = TicketStatus.New,
            CreatedAt = now, UpdatedAt = now
        };
        ticket.Messages.Add(new TicketMessage
        {
            Id = Guid.CreateVersion7(), WorkspaceId = workspaceContext.WorkspaceId.Value,
            AuthorPersonaId = workspaceContext.PersonaId.Value, Body = request.Message!.Trim(), CreatedAt = now
        });
        db.SupportTickets.Add(ticket);
        await db.SaveChangesAsync(cancellationToken);
        return Results.Created($"/api/v1/tickets/{ticket.Id}", new { ticket.Id, ticket.Number });
    }

    private static async Task<IResult> AddMessageAsync(
        Guid id, TicketMessageRequest request, HttpContext context, PortalDbContext db,
        WorkspaceContext workspaceContext, CancellationToken cancellationToken)
    {
        if (ValidateMessage(request.Body) is { } invalid) return invalid;
        var ticket = await VisibleTicket(db, context, workspaceContext, id).SingleOrDefaultAsync(cancellationToken);
        if (ticket is null) return Results.NotFound();
        if (ticket.Status == TicketStatus.Closed) return Results.Conflict(new { message = "Το κλειστό αίτημα δεν δέχεται νέα μηνύματα." });
        var now = DateTimeOffset.UtcNow;
        db.TicketMessages.Add(new TicketMessage
        {
            Id = Guid.CreateVersion7(), WorkspaceId = workspaceContext.WorkspaceId!.Value, TicketId = ticket.Id,
            AuthorPersonaId = workspaceContext.PersonaId!.Value, Body = request.Body!.Trim(), CreatedAt = now
        });
        ticket.UpdatedAt = now;
        if (!IsAdmin(context) && ticket.Status == TicketStatus.AwaitingClient) ticket.Status = TicketStatus.InProgress;
        await db.SaveChangesAsync(cancellationToken);
        return Results.Created($"/api/v1/tickets/{ticket.Id}", new { ticket.Id });
    }

    private static async Task<IResult> UpdateStatusAsync(
        Guid id, TicketStatusRequest request, PortalDbContext db, CancellationToken cancellationToken)
    {
        var ticket = await db.SupportTickets.SingleOrDefaultAsync(x => x.Id == id, cancellationToken);
        if (ticket is null) return Results.NotFound();
        if (!Enum.IsDefined(request.Status)) return Invalid("status", "Η κατάσταση δεν είναι έγκυρη.");
        if (ticket.Status == request.Status) return Results.NoContent();
        if (!TicketRules.CanTransition(ticket.Status, request.Status))
            return Results.Conflict(new { message = $"Δεν επιτρέπεται μετάβαση από «{TicketLabels.Status(ticket.Status)}» σε «{TicketLabels.Status(request.Status)}»." });
        ticket.Status = request.Status; ticket.UpdatedAt = DateTimeOffset.UtcNow;
        await db.SaveChangesAsync(cancellationToken);
        return Results.NoContent();
    }

    private static async Task<IResult> AddBillingDecisionAsync(
        Guid id, BillingDecisionRequest request, PortalDbContext db, WorkspaceContext workspaceContext, CancellationToken cancellationToken)
    {
        if (!Enum.IsDefined(request.Decision)) return Invalid("decision", "Η απόφαση χρέωσης δεν είναι έγκυρη.");
        if (TicketRules.ValidateBilling(request.Decision, request.Price) is { } billingError)
            return Invalid("price", billingError);
        if (request.Note?.Length > 500) return Invalid("note", "Η σημείωση δεν μπορεί να ξεπερνά τους 500 χαρακτήρες.");
        var ticket = await db.SupportTickets.SingleOrDefaultAsync(x => x.Id == id, cancellationToken);
        if (ticket is null) return Results.NotFound();
        var now = DateTimeOffset.UtcNow;
        var decision = new TicketBillingDecision
        {
            Id = Guid.CreateVersion7(), WorkspaceId = workspaceContext.WorkspaceId!.Value, TicketId = id,
            Decision = request.Decision, Price = request.Decision == BillingDecisionKind.Chargeable ? request.Price : null,
            Currency = "EUR", Note = string.IsNullOrWhiteSpace(request.Note) ? null : request.Note.Trim(),
            ReviewerPersonaId = workspaceContext.PersonaId!.Value, DecidedAt = now
        };
        ticket.UpdatedAt = now;
        db.TicketBillingDecisions.Add(decision);
        await db.SaveChangesAsync(cancellationToken);
        return Results.Created($"/api/v1/tickets/{id}", new { decision.Id });
    }

    private static IQueryable<SupportTicket> VisibleTicket(
        PortalDbContext db, HttpContext context, WorkspaceContext workspaceContext, Guid id)
    {
        var query = db.SupportTickets.Where(x => x.Id == id);
        return IsAdmin(context) ? query : query.Where(x => x.OwnerPersonaId == workspaceContext.PersonaId);
    }

    private static IResult? ValidateTitle(string? value) =>
        string.IsNullOrWhiteSpace(value) || value.Trim().Length is < 4 or > 180
            ? Invalid("title", "Ο τίτλος πρέπει να έχει από 4 έως 180 χαρακτήρες.") : null;
    private static IResult? ValidateMessage(string? value) =>
        string.IsNullOrWhiteSpace(value) || value.Trim().Length is < 2 or > 4000
            ? Invalid("message", "Το μήνυμα πρέπει να έχει από 2 έως 4.000 χαρακτήρες.") : null;
    private static bool IsAdmin(HttpContext context) => context.User.IsInRole(DemoRole.Administrator.ToString());
    private static IResult Invalid(string key, string message) => Results.ValidationProblem(new Dictionary<string, string[]> { [key] = [message] });
}

public sealed record TicketCreateRequest(string? Title, string? Message, TicketKind Kind, TicketPriority Priority, Guid? ManagedAssetId);
public sealed record TicketMessageRequest(string? Body);
public sealed record TicketStatusRequest(TicketStatus Status);
public sealed record BillingDecisionRequest(BillingDecisionKind Decision, decimal? Price, string? Note);

public sealed record TicketSummaryResponse(
    Guid Id, string Number, string Title, string Kind, string KindLabel, string Priority, string PriorityLabel,
    string Status, string StatusLabel, string? AssetName, DateTimeOffset UpdatedAt, int MessageCount, BillingDecisionResponse? BillingDecision)
{
    public static TicketSummaryResponse From(SupportTicket ticket) => new(
        ticket.Id, ticket.Number, ticket.Title, ticket.Kind.ToString(), TicketLabels.Kind(ticket.Kind),
        ticket.Priority.ToString(), TicketLabels.Priority(ticket.Priority), ticket.Status.ToString(), TicketLabels.Status(ticket.Status),
        ticket.ManagedAsset?.Name, ticket.UpdatedAt, ticket.Messages.Count,
        ticket.BillingDecisions.OrderByDescending(x => x.DecidedAt).Select(BillingDecisionResponse.From).FirstOrDefault());
}

public sealed record TicketDetailResponse(
    Guid Id, string Number, string Title, string Kind, string KindLabel, string Priority, string PriorityLabel,
    string Status, string StatusLabel, string? AssetName, string OwnerName, DateTimeOffset CreatedAt,
    IReadOnlyList<TicketMessageResponse> Messages, IReadOnlyList<BillingDecisionResponse> BillingDecisions)
{
    public static TicketDetailResponse From(SupportTicket ticket) => new(
        ticket.Id, ticket.Number, ticket.Title, ticket.Kind.ToString(), TicketLabels.Kind(ticket.Kind),
        ticket.Priority.ToString(), TicketLabels.Priority(ticket.Priority), ticket.Status.ToString(), TicketLabels.Status(ticket.Status),
        ticket.ManagedAsset?.Name, $"{ticket.OwnerPersona.FirstName} {ticket.OwnerPersona.LastName}", ticket.CreatedAt,
        ticket.Messages.OrderBy(x => x.CreatedAt).Select(TicketMessageResponse.From).ToArray(),
        ticket.BillingDecisions.OrderByDescending(x => x.DecidedAt).Select(BillingDecisionResponse.From).ToArray());
}

public sealed record TicketMessageResponse(Guid Id, string Body, string AuthorName, string AuthorRole, DateTimeOffset CreatedAt)
{
    public static TicketMessageResponse From(TicketMessage message) => new(
        message.Id, message.Body, $"{message.AuthorPersona.FirstName} {message.AuthorPersona.LastName}",
        message.AuthorPersona.Role.ToString(), message.CreatedAt);
}

public sealed record BillingDecisionResponse(Guid Id, string Decision, string DecisionLabel, decimal? Price, string Currency, string? Note, string ReviewerName, DateTimeOffset DecidedAt)
{
    public static BillingDecisionResponse From(TicketBillingDecision decision) => new(
        decision.Id, decision.Decision.ToString(), decision.Decision == BillingDecisionKind.Covered ? "Καλύπτεται" : "Χρεώσιμο",
        decision.Price, decision.Currency, decision.Note,
        decision.ReviewerPersona is null ? "" : $"{decision.ReviewerPersona.FirstName} {decision.ReviewerPersona.LastName}", decision.DecidedAt);
}

public static class TicketLabels
{
    public static string Kind(TicketKind value) => value switch
    {
        TicketKind.Support => "Υποστήριξη", TicketKind.ChangeRequest => "Αίτημα αλλαγής",
        TicketKind.Bug => "Πρόβλημα", TicketKind.Feature => "Νέα λειτουργία", _ => value.ToString()
    };
    public static string Priority(TicketPriority value) => value switch
    {
        TicketPriority.Normal => "Κανονική", TicketPriority.High => "Υψηλή", TicketPriority.Urgent => "Επείγουσα", _ => value.ToString()
    };
    public static string Status(TicketStatus value) => value switch
    {
        TicketStatus.New => "Νέο", TicketStatus.InProgress => "Σε εξέλιξη", TicketStatus.AwaitingClient => "Αναμονή πελάτη",
        TicketStatus.Resolved => "Επιλύθηκε", TicketStatus.Closed => "Κλειστό", _ => value.ToString()
    };
}

public static class TicketRules
{
    private static readonly IReadOnlyDictionary<TicketStatus, TicketStatus[]> AllowedTransitions =
        new Dictionary<TicketStatus, TicketStatus[]>
        {
            [TicketStatus.New] = [TicketStatus.InProgress, TicketStatus.Closed],
            [TicketStatus.InProgress] = [TicketStatus.AwaitingClient, TicketStatus.Resolved, TicketStatus.Closed],
            [TicketStatus.AwaitingClient] = [TicketStatus.InProgress, TicketStatus.Resolved, TicketStatus.Closed],
            [TicketStatus.Resolved] = [TicketStatus.InProgress, TicketStatus.Closed],
            [TicketStatus.Closed] = [TicketStatus.InProgress]
        };

    public static bool CanTransition(TicketStatus current, TicketStatus next) =>
        current == next || AllowedTransitions[current].Contains(next);

    public static string? ValidateBilling(BillingDecisionKind decision, decimal? price) => decision switch
    {
        BillingDecisionKind.Chargeable when price is null or <= 0 or > 1_000_000 => "Η χρεώσιμη εργασία απαιτεί θετική τιμή.",
        BillingDecisionKind.Covered when price is not null and not 0 => "Η καλυπτόμενη εργασία δεν μπορεί να έχει τιμή.",
        _ => null
    };
}
