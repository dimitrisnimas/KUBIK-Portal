using KubikPortal.Api.Data;
using KubikPortal.Api.Domain;
using KubikPortal.Api.Infrastructure;
using Microsoft.EntityFrameworkCore;

namespace KubikPortal.Api.Features.Billing;

public static class BillingEndpoints
{
    public static RouteGroupBuilder MapBillingEndpoints(this RouteGroupBuilder api)
    {
        var invoices = api.MapGroup("/invoices").RequireAuthorization();
        invoices.MapGet("/", GetInvoicesAsync);
        invoices.MapGet("/{id:guid}", GetInvoiceAsync);
        invoices.MapGet("/{id:guid}/pdf", GetInvoicePdfAsync);
        invoices.MapPost("/{id:guid}/payment-declarations", SubmitPaymentDeclarationAsync)
            .RequireAuthorization(policy => policy.RequireRole(DemoRole.Client.ToString()))
            .AddEndpointFilter<AntiforgeryEndpointFilter>();

        var admin = api.MapGroup("/admin")
            .RequireAuthorization(policy => policy.RequireRole(DemoRole.Administrator.ToString()));
        admin.MapPost("/invoices", CreateInvoiceAsync).AddEndpointFilter<AntiforgeryEndpointFilter>();
        admin.MapGet("/payment-declarations", GetPaymentDeclarationsAsync);
        admin.MapPost("/payment-declarations/{id:guid}/review", ReviewPaymentDeclarationAsync)
            .AddEndpointFilter<AntiforgeryEndpointFilter>();
        return api;
    }

    private static async Task<IResult> GetInvoicesAsync(
        HttpContext context, PortalDbContext db, WorkspaceContext workspaceContext, CancellationToken cancellationToken)
    {
        var query = db.Invoices.AsNoTracking();
        if (!IsAdmin(context)) query = query.Where(x => x.ClientPersonaId == workspaceContext.PersonaId);
        var records = await query.Include(x => x.PaymentDeclarations).OrderByDescending(x => x.IssueDate).ToListAsync(cancellationToken);
        return Results.Ok(records.Select(InvoiceSummaryResponse.From));
    }

    private static async Task<IResult> GetInvoiceAsync(
        Guid id, HttpContext context, PortalDbContext db, WorkspaceContext workspaceContext, CancellationToken cancellationToken)
    {
        var invoice = await VisibleInvoice(db, context, workspaceContext, id).AsNoTracking()
            .Include(x => x.ClientPersona).Include(x => x.Lines)
            .Include(x => x.PaymentDeclarations).ThenInclude(x => x.ReviewerPersona)
            .AsSplitQuery().SingleOrDefaultAsync(cancellationToken);
        return invoice is null ? Results.NotFound() : Results.Ok(InvoiceDetailResponse.From(invoice));
    }

    private static async Task<IResult> GetInvoicePdfAsync(
        Guid id, HttpContext context, PortalDbContext db, WorkspaceContext workspaceContext,
        InvoicePdfGenerator generator, CancellationToken cancellationToken)
    {
        var invoice = await VisibleInvoice(db, context, workspaceContext, id).AsNoTracking()
            .Include(x => x.ClientPersona).Include(x => x.Lines).AsSplitQuery().SingleOrDefaultAsync(cancellationToken);
        return invoice is null
            ? Results.NotFound()
            : Results.File(generator.Generate(invoice), "application/pdf", $"{invoice.Number}.pdf");
    }

    private static async Task<IResult> CreateInvoiceAsync(
        InvoiceCreateRequest request, PortalDbContext db, WorkspaceContext workspaceContext, CancellationToken cancellationToken)
    {
        if (request.IssueDate == default) return Invalid("issueDate", "Η ημερομηνία έκδοσης είναι υποχρεωτική.");
        if (request.DueDate < request.IssueDate) return Invalid("dueDate", "Η ημερομηνία λήξης δεν μπορεί να προηγείται της έκδοσης.");
        if (request.Lines is null || request.Lines.Count is < 1 or > 8) return Invalid("lines", "Απαιτείται από 1 έως 8 γραμμές χρέωσης.");
        if (request.Lines.Any(x => string.IsNullOrWhiteSpace(x.Description) || x.Description.Trim().Length > 100 || x.Quantity is <= 0 or > 100_000 || x.UnitPrice is < 0 or > 1_000_000))
            return Invalid("lines", "Οι γραμμές χρέωσης περιέχουν μη έγκυρα στοιχεία.");
        if (request.Notes?.Length > 1000) return Invalid("notes", "Οι σημειώσεις δεν μπορούν να ξεπερνούν τους 1.000 χαρακτήρες.");

        var clientId = await db.DemoPersonas.Where(x => x.Role == DemoRole.Client && x.Status == PersonaStatus.Active)
            .Select(x => x.Id).FirstAsync(cancellationToken);
        var invoiceId = Guid.CreateVersion7();
        var totals = InvoiceRules.Calculate(request.Lines.Select(x => (x.Quantity, x.UnitPrice)));
        var number = $"KINV-{request.IssueDate.Year}-{invoiceId.ToString("N")[..6].ToUpperInvariant()}";
        var invoice = new Invoice
        {
            Id = invoiceId, WorkspaceId = workspaceContext.WorkspaceId!.Value, ClientPersonaId = clientId,
            Number = number, IssueDate = request.IssueDate, DueDate = request.DueDate, Status = InvoiceStatus.Unpaid,
            Subtotal = totals.Subtotal, VatRate = totals.VatRate, VatAmount = totals.VatAmount, Total = totals.Total,
            Currency = "EUR", Notes = string.IsNullOrWhiteSpace(request.Notes) ? null : request.Notes.Trim(), CreatedAt = DateTimeOffset.UtcNow,
            Lines = request.Lines.Select((line, index) => new InvoiceLine
            {
                Id = Guid.CreateVersion7(), WorkspaceId = workspaceContext.WorkspaceId.Value, Position = index + 1,
                Description = line.Description!.Trim(), Quantity = line.Quantity, UnitPrice = line.UnitPrice,
                LineTotal = decimal.Round(line.Quantity * line.UnitPrice, 2, MidpointRounding.AwayFromZero)
            }).ToList()
        };
        db.Invoices.Add(invoice); await db.SaveChangesAsync(cancellationToken);
        return Results.Created($"/api/v1/invoices/{invoice.Id}", new { invoice.Id, invoice.Number });
    }

    private static async Task<IResult> SubmitPaymentDeclarationAsync(
        Guid id, PaymentDeclarationCreateRequest request, PortalDbContext db,
        WorkspaceContext workspaceContext, CancellationToken cancellationToken)
    {
        if (string.IsNullOrWhiteSpace(request.Reference) || request.Reference.Trim().Length is < 4 or > 500)
            return Invalid("reference", "Η αναφορά πληρωμής πρέπει να έχει από 4 έως 500 χαρακτήρες.");
        if (request.Note?.Length > 1000) return Invalid("note", "Η σημείωση δεν μπορεί να ξεπερνά τους 1.000 χαρακτήρες.");
        var invoice = await db.Invoices.Include(x => x.ClientPersona)
            .SingleOrDefaultAsync(x => x.Id == id && x.ClientPersonaId == workspaceContext.PersonaId, cancellationToken);
        if (invoice is null) return Results.NotFound();
        if (invoice.Status == InvoiceStatus.Paid) return Results.Conflict(new { message = "Το τιμολόγιο είναι ήδη εξοφλημένο." });
        if (await db.PaymentDeclarations.AnyAsync(x => x.InvoiceId == id && x.Status == PaymentDeclarationStatus.PendingReview, cancellationToken))
            return Results.Conflict(new { message = "Υπάρχει ήδη δήλωση πληρωμής σε αναμονή ελέγχου." });
        var declaration = new PaymentDeclaration
        {
            Id = Guid.CreateVersion7(), WorkspaceId = workspaceContext.WorkspaceId!.Value, InvoiceId = id, Invoice = invoice,
            SubmittedReference = request.Reference!.Trim(), SubmittedNote = string.IsNullOrWhiteSpace(request.Note) ? null : request.Note.Trim(),
            SubmittedAt = DateTimeOffset.UtcNow, Status = PaymentDeclarationStatus.PendingReview
        };
        db.PaymentDeclarations.Add(declaration);
        try { await db.SaveChangesAsync(cancellationToken); }
        catch (DbUpdateException) { return Results.Conflict(new { message = "Υπάρχει ήδη δήλωση πληρωμής σε αναμονή ελέγχου." }); }
        return Results.Created($"/api/v1/invoices/{id}", PaymentDeclarationResponse.From(declaration));
    }

    private static async Task<IResult> GetPaymentDeclarationsAsync(
        PaymentDeclarationStatus? status, PortalDbContext db, CancellationToken cancellationToken)
    {
        var query = db.PaymentDeclarations.AsNoTracking();
        if (status is not null) query = query.Where(x => x.Status == status);
        var records = await query.Include(x => x.Invoice).ThenInclude(x => x.ClientPersona)
            .Include(x => x.ReviewerPersona).OrderByDescending(x => x.SubmittedAt).ToListAsync(cancellationToken);
        return Results.Ok(records.Select(PaymentDeclarationResponse.From));
    }

    private static async Task<IResult> ReviewPaymentDeclarationAsync(
        Guid id, PaymentDeclarationReviewRequest request, PortalDbContext db,
        WorkspaceContext workspaceContext, CancellationToken cancellationToken)
    {
        if (request.Status is not (PaymentDeclarationStatus.Approved or PaymentDeclarationStatus.Rejected))
            return Invalid("status", "Η απόφαση πρέπει να είναι έγκριση ή απόρριψη.");
        if (request.ReviewNote?.Length > 1000) return Invalid("reviewNote", "Η σημείωση ελέγχου δεν μπορεί να ξεπερνά τους 1.000 χαρακτήρες.");
        var pending = await db.PaymentDeclarations.AsNoTracking()
            .Where(x => x.Id == id && x.Status == PaymentDeclarationStatus.PendingReview)
            .Select(x => new { x.InvoiceId }).SingleOrDefaultAsync(cancellationToken);
        if (pending is null) return Results.Conflict(new { message = "Η δήλωση έχει ήδη αξιολογηθεί ή δεν υπάρχει." });
        var now = DateTimeOffset.UtcNow;
        var reviewNote = string.IsNullOrWhiteSpace(request.ReviewNote) ? null : request.ReviewNote.Trim();
        await using var transaction = await db.Database.BeginTransactionAsync(cancellationToken);
        var reviewed = await db.PaymentDeclarations.Where(x => x.Id == id && x.Status == PaymentDeclarationStatus.PendingReview)
            .ExecuteUpdateAsync(update => update
                .SetProperty(x => x.Status, request.Status)
                .SetProperty(x => x.ReviewedAt, now)
                .SetProperty(x => x.ReviewerPersonaId, workspaceContext.PersonaId)
                .SetProperty(x => x.ReviewNote, reviewNote), cancellationToken);
        if (reviewed != 1) return Results.Conflict(new { message = "Η δήλωση έχει ήδη αξιολογηθεί." });
        if (request.Status == PaymentDeclarationStatus.Approved)
        {
            var paid = await db.Invoices.Where(x => x.Id == pending.InvoiceId && x.Status == InvoiceStatus.Unpaid)
                .ExecuteUpdateAsync(update => update.SetProperty(x => x.Status, InvoiceStatus.Paid).SetProperty(x => x.PaidAt, now), cancellationToken);
            if (paid != 1)
            {
                await transaction.RollbackAsync(cancellationToken);
                return Results.Conflict(new { message = "Το τιμολόγιο δεν μπορεί να επισημανθεί ως εξοφλημένο." });
            }
        }
        await transaction.CommitAsync(cancellationToken);
        return Results.NoContent();
    }

    private static IQueryable<Invoice> VisibleInvoice(PortalDbContext db, HttpContext context, WorkspaceContext workspaceContext, Guid id)
    {
        var query = db.Invoices.Where(x => x.Id == id);
        return IsAdmin(context) ? query : query.Where(x => x.ClientPersonaId == workspaceContext.PersonaId);
    }
    private static bool IsAdmin(HttpContext context) => context.User.IsInRole(DemoRole.Administrator.ToString());
    private static IResult Invalid(string key, string message) => Results.ValidationProblem(new Dictionary<string, string[]> { [key] = [message] });
}

public sealed record InvoiceLineRequest(string? Description, decimal Quantity, decimal UnitPrice);
public sealed record InvoiceCreateRequest(DateOnly IssueDate, DateOnly DueDate, string? Notes, IReadOnlyList<InvoiceLineRequest>? Lines);
public sealed record PaymentDeclarationCreateRequest(string? Reference, string? Note);
public sealed record PaymentDeclarationReviewRequest(PaymentDeclarationStatus Status, string? ReviewNote);

public sealed record InvoiceSummaryResponse(Guid Id, string Number, DateOnly IssueDate, DateOnly DueDate, string Status, string StatusLabel, decimal Total, string Currency, bool IsOverdue, string? PaymentStatus)
{
    public static InvoiceSummaryResponse From(Invoice invoice) => new(
        invoice.Id, invoice.Number, invoice.IssueDate, invoice.DueDate, invoice.Status.ToString(),
        invoice.Status == InvoiceStatus.Paid ? "Εξοφλημένο" : "Ανεξόφλητο", invoice.Total, invoice.Currency,
        invoice.Status == InvoiceStatus.Unpaid && invoice.DueDate < DateOnly.FromDateTime(DateTime.UtcNow),
        invoice.PaymentDeclarations.OrderByDescending(x => x.SubmittedAt).Select(x => x.Status.ToString()).FirstOrDefault());
}

public sealed record InvoiceLineResponse(Guid Id, int Position, string Description, decimal Quantity, decimal UnitPrice, decimal LineTotal)
{
    public static InvoiceLineResponse From(InvoiceLine line) => new(line.Id, line.Position, line.Description, line.Quantity, line.UnitPrice, line.LineTotal);
}

public sealed record InvoiceDetailResponse(
    Guid Id, string Number, DateOnly IssueDate, DateOnly DueDate, string Status, string StatusLabel, DateTimeOffset? PaidAt,
    decimal Subtotal, decimal VatRate, decimal VatAmount, decimal Total, string Currency, string? Notes, string ClientName,
    IReadOnlyList<InvoiceLineResponse> Lines, IReadOnlyList<PaymentDeclarationResponse> PaymentDeclarations)
{
    public static InvoiceDetailResponse From(Invoice invoice) => new(
        invoice.Id, invoice.Number, invoice.IssueDate, invoice.DueDate, invoice.Status.ToString(),
        invoice.Status == InvoiceStatus.Paid ? "Εξοφλημένο" : "Ανεξόφλητο", invoice.PaidAt,
        invoice.Subtotal, invoice.VatRate, invoice.VatAmount, invoice.Total, invoice.Currency, invoice.Notes,
        $"{invoice.ClientPersona.FirstName} {invoice.ClientPersona.LastName}",
        invoice.Lines.OrderBy(x => x.Position).Select(InvoiceLineResponse.From).ToArray(),
        invoice.PaymentDeclarations.OrderByDescending(x => x.SubmittedAt).Select(PaymentDeclarationResponse.From).ToArray());
}

public sealed record PaymentDeclarationResponse(
    Guid Id, Guid InvoiceId, string InvoiceNumber, decimal InvoiceTotal, string ClientName, string Reference, string? SubmittedNote,
    DateTimeOffset SubmittedAt, string Status, string StatusLabel, DateTimeOffset? ReviewedAt, string? ReviewerName, string? ReviewNote)
{
    public static PaymentDeclarationResponse From(PaymentDeclaration declaration) => new(
        declaration.Id, declaration.InvoiceId, declaration.Invoice?.Number ?? "", declaration.Invoice?.Total ?? 0,
        declaration.Invoice?.ClientPersona is null ? "" : $"{declaration.Invoice.ClientPersona.FirstName} {declaration.Invoice.ClientPersona.LastName}",
        declaration.SubmittedReference, declaration.SubmittedNote, declaration.SubmittedAt, declaration.Status.ToString(),
        declaration.Status switch { PaymentDeclarationStatus.PendingReview => "Σε αναμονή", PaymentDeclarationStatus.Approved => "Εγκρίθηκε", _ => "Απορρίφθηκε" },
        declaration.ReviewedAt, declaration.ReviewerPersona is null ? null : $"{declaration.ReviewerPersona.FirstName} {declaration.ReviewerPersona.LastName}", declaration.ReviewNote);
}
