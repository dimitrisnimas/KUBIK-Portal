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

        db.ManagedAssets.AddRange(
            Asset(workspaceId, client.Id, care.Id, "Εταιρική Ιστοσελίδα", AssetType.Website, "https://example.gr", now.AddMonths(-8)),
            Asset(workspaceId, client.Id, commerce.Id, "Ηλεκτρονικό Κατάστημα", AssetType.Eshop, "https://shop.example.gr", now.AddMonths(-4)),
            Asset(workspaceId, client.Id, growth.Id, "Οργανική Ανάπτυξη", AssetType.Seo, null, now.AddMonths(-2)));

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

    private static Guid StableId(Guid workspaceId, string key)
    {
        var hash = SHA256.HashData(Encoding.UTF8.GetBytes($"{workspaceId:N}:{key}"));
        return new Guid(hash.AsSpan(0, 16));
    }
}
