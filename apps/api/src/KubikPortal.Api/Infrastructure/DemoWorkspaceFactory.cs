using System.Security.Cryptography;
using System.Text;
using KubikPortal.Api.Data;
using KubikPortal.Api.Domain;
using Microsoft.Extensions.Options;

namespace KubikPortal.Api.Infrastructure;

public sealed class DemoWorkspaceFactory(
    PortalDbContext db,
    WorkspaceContext workspaceContext,
    IOptions<DemoOptions> options)
{
    public async Task<(DemoWorkspace Workspace, DemoPersona Persona, DemoSession Session)> CreateAsync(
        string verifiedEmail,
        DemoRole selectedRole,
        CancellationToken cancellationToken)
    {
        var now = DateTimeOffset.UtcNow;
        var workspaceId = Guid.CreateVersion7();
        var expiresAt = now.AddMinutes(options.Value.WorkspaceLifetimeMinutes);
        var workspace = new DemoWorkspace
        {
            Id = workspaceId,
            VerifiedEmail = verifiedEmail,
            SeedVersion = "v1",
            CreatedAt = now,
            LastSeenAt = now,
            ExpiresAt = expiresAt
        };
        db.DemoWorkspaces.Add(workspace);
        workspaceContext.Set(workspaceId, Guid.Empty);

        var client = new DemoPersona
        {
            Id = StableId(workspaceId, "persona:client"),
            WorkspaceId = workspaceId,
            Role = DemoRole.Client,
            FirstName = "Μαρία",
            LastName = "Παπαδοπούλου",
            DisplayEmail = verifiedEmail,
            Status = PersonaStatus.Active
        };
        var administrator = new DemoPersona
        {
            Id = StableId(workspaceId, "persona:admin"),
            WorkspaceId = workspaceId,
            Role = DemoRole.Administrator,
            FirstName = "Νίκος",
            LastName = "Διαχειριστής",
            DisplayEmail = verifiedEmail,
            Status = PersonaStatus.Active
        };
        db.DemoPersonas.AddRange(client, administrator);

        var webCategory = Category(workspaceId, "web", "Ιστοσελίδες", "#2563eb", 1);
        var growthCategory = Category(workspaceId, "growth", "Ανάπτυξη", "#7c3aed", 2);
        db.ServiceCategories.AddRange(webCategory, growthCategory);

        var care = Package(workspaceId, "care", webCategory.Id, "Web Care", "Συνεχής φροντίδα και τεχνική υποστήριξη.", 89m);
        var commerce = Package(workspaceId, "commerce", webCategory.Id, "E-commerce Plus", "Υποστήριξη και βελτιστοποίηση ηλεκτρονικού καταστήματος.", 179m);
        var growth = Package(workspaceId, "growth", growthCategory.Id, "Digital Growth", "SEO, περιεχόμενο και μηνιαία παρακολούθηση.", 249m);
        db.ServicePackages.AddRange(care, commerce, growth);
        db.ServicePackageFeatures.AddRange(
            Feature(workspaceId, care.Id, "care:1", 1, "Ενημερώσεις και αντίγραφα ασφαλείας"),
            Feature(workspaceId, care.Id, "care:2", 2, "Έως 2 ώρες τεχνικής υποστήριξης"),
            Feature(workspaceId, commerce.Id, "commerce:1", 1, "Παρακολούθηση διαθεσιμότητας"),
            Feature(workspaceId, commerce.Id, "commerce:2", 2, "Έως 5 ώρες τεχνικής υποστήριξης"),
            Feature(workspaceId, growth.Id, "growth:1", 1, "Μηνιαία αναφορά SEO"));

        var website = Asset(workspaceId, client.Id, care.Id, "Εταιρική Ιστοσελίδα", AssetType.Website, "https://example.gr", now.AddMonths(-8));
        var eshop = Asset(workspaceId, client.Id, commerce.Id, "Ηλεκτρονικό Κατάστημα", AssetType.Eshop, "https://shop.example.gr", now.AddMonths(-4));
        var seo = Asset(workspaceId, client.Id, growth.Id, "Οργανική Ανάπτυξη", AssetType.Seo, null, now.AddMonths(-2));
        db.ManagedAssets.AddRange(website, eshop, seo);

        var contentTicket = Ticket(workspaceId, client.Id, website.Id, "K-1001", "Ενημέρωση στοιχείων επικοινωνίας", TicketKind.ChangeRequest, TicketPriority.Normal, TicketStatus.InProgress, now.AddDays(-6));
        var speedTicket = Ticket(workspaceId, client.Id, eshop.Id, "K-1002", "Έλεγχος ταχύτητας καταστήματος", TicketKind.Support, TicketPriority.High, TicketStatus.AwaitingClient, now.AddDays(-3));
        var landingTicket = Ticket(workspaceId, client.Id, website.Id, "K-1003", "Νέα landing page καμπάνιας", TicketKind.ChangeRequest, TicketPriority.Normal, TicketStatus.New, now.AddDays(-1));
        contentTicket.UpdatedAt = now.AddDays(-5);
        speedTicket.UpdatedAt = now.AddDays(-2);
        landingTicket.UpdatedAt = now.AddHours(-18);
        db.SupportTickets.AddRange(contentTicket, speedTicket, landingTicket);
        db.TicketMessages.AddRange(
            Message(workspaceId, contentTicket.Id, client.Id, "message:1001:1", "Θα θέλαμε να ενημερωθούν το τηλέφωνο και η διεύθυνση στη σελίδα επικοινωνίας.", now.AddDays(-6)),
            Message(workspaceId, contentTicket.Id, administrator.Id, "message:1001:2", "Λάβαμε το αίτημα και έχουμε ξεκινήσει την ενημέρωση.", now.AddDays(-5)),
            Message(workspaceId, speedTicket.Id, client.Id, "message:1002:1", "Το κατάστημα φαίνεται πιο αργό τις απογευματινές ώρες. Μπορείτε να το ελέγξετε;", now.AddDays(-3)),
            Message(workspaceId, speedTicket.Id, administrator.Id, "message:1002:2", "Ο αρχικός έλεγχος ολοκληρώθηκε. Χρειαζόμαστε ένα πρόσφατο παράδειγμα σελίδας που άργησε.", now.AddDays(-2)),
            Message(workspaceId, landingTicket.Id, client.Id, "message:1003:1", "Χρειαζόμαστε μία νέα landing page για την ανοιξιάτικη καμπάνια.", now.AddDays(-1)));
        db.TicketBillingDecisions.AddRange(
            Decision(workspaceId, speedTicket.Id, administrator.Id, "decision:1002:1", BillingDecisionKind.Covered, null, "Καλύπτεται από το ενεργό πακέτο υποστήριξης.", now.AddDays(-2)),
            Decision(workspaceId, landingTicket.Id, administrator.Id, "decision:1003:1", BillingDecisionKind.Chargeable, 480m, "Εκτίμηση για σχεδιασμό και ανάπτυξη landing page.", now.AddHours(-18)));

        var selectedPersona = selectedRole == DemoRole.Administrator ? administrator : client;
        var session = new DemoSession
        {
            Id = Guid.CreateVersion7(),
            WorkspaceId = workspaceId,
            PersonaId = selectedPersona.Id,
            CreatedAt = now,
            LastSeenAt = now,
            ExpiresAt = expiresAt
        };
        db.DemoSessions.Add(session);
        await db.SaveChangesAsync(cancellationToken);
        workspaceContext.Set(workspaceId, selectedPersona.Id);
        return (workspace, selectedPersona, session);
    }

    private static ServiceCategory Category(Guid workspaceId, string key, string name, string color, int order) => new()
    {
        Id = StableId(workspaceId, $"category:{key}"), WorkspaceId = workspaceId, Name = name,
        Color = color, DisplayOrder = order, IsActive = true
    };

    private static ServicePackage Package(Guid workspaceId, string key, Guid categoryId, string name, string description, decimal price) => new()
    {
        Id = StableId(workspaceId, $"package:{key}"), WorkspaceId = workspaceId, CategoryId = categoryId,
        Name = name, Description = description, MonthlyPrice = price, Currency = "EUR", IsActive = true
    };

    private static ServicePackageFeature Feature(Guid workspaceId, Guid packageId, string key, int position, string text) => new()
    {
        Id = StableId(workspaceId, $"feature:{key}"), WorkspaceId = workspaceId,
        ServicePackageId = packageId, Position = position, Text = text
    };

    private static ManagedAsset Asset(Guid workspaceId, Guid ownerId, Guid packageId, string name, AssetType type, string? url, DateTimeOffset createdAt) => new()
    {
        Id = StableId(workspaceId, $"asset:{name}"), WorkspaceId = workspaceId, OwnerPersonaId = ownerId,
        ServicePackageId = packageId, Name = name, AssetType = type, Status = AssetStatus.Active, Url = url, CreatedAt = createdAt
    };

    private static SupportTicket Ticket(Guid workspaceId, Guid ownerId, Guid? assetId, string number, string title, TicketKind kind, TicketPriority priority, TicketStatus status, DateTimeOffset createdAt) => new()
    {
        Id = StableId(workspaceId, $"ticket:{number}"), WorkspaceId = workspaceId, OwnerPersonaId = ownerId,
        ManagedAssetId = assetId, Number = number, Title = title, Kind = kind, Priority = priority,
        Status = status, CreatedAt = createdAt, UpdatedAt = createdAt
    };

    private static TicketMessage Message(Guid workspaceId, Guid ticketId, Guid authorId, string key, string body, DateTimeOffset createdAt) => new()
    {
        Id = StableId(workspaceId, key), WorkspaceId = workspaceId, TicketId = ticketId,
        AuthorPersonaId = authorId, Body = body, CreatedAt = createdAt
    };

    private static TicketBillingDecision Decision(Guid workspaceId, Guid ticketId, Guid reviewerId, string key, BillingDecisionKind decision, decimal? price, string note, DateTimeOffset decidedAt) => new()
    {
        Id = StableId(workspaceId, key), WorkspaceId = workspaceId, TicketId = ticketId,
        ReviewerPersonaId = reviewerId, Decision = decision, Price = price, Currency = "EUR", Note = note, DecidedAt = decidedAt
    };

    private static Guid StableId(Guid workspaceId, string key)
    {
        var hash = SHA256.HashData(Encoding.UTF8.GetBytes($"{workspaceId:N}:{key}"));
        return new Guid(hash.AsSpan(0, 16));
    }
}
