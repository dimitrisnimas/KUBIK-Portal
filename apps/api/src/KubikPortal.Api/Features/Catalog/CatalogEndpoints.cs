using System.Text.RegularExpressions;
using KubikPortal.Api.Data;
using KubikPortal.Api.Domain;
using KubikPortal.Api.Infrastructure;
using Microsoft.EntityFrameworkCore;

namespace KubikPortal.Api.Features.Catalog;

public static partial class CatalogEndpoints
{
    public static RouteGroupBuilder MapCatalogEndpoints(this RouteGroupBuilder api)
    {
        api.MapGet("/catalog", GetCatalogAsync).RequireAuthorization();

        var assets = api.MapGroup("/assets").RequireAuthorization();
        assets.MapGet("/", GetAssetsAsync);
        assets.MapPost("/", CreateAssetAsync).AddEndpointFilter<AntiforgeryEndpointFilter>();
        assets.MapPut("/{id:guid}", UpdateAssetAsync).AddEndpointFilter<AntiforgeryEndpointFilter>();
        assets.MapDelete("/{id:guid}", DeleteAssetAsync).AddEndpointFilter<AntiforgeryEndpointFilter>();

        var admin = api.MapGroup("/admin")
            .RequireAuthorization(policy => policy.RequireRole(DemoRole.Administrator.ToString()));
        admin.MapPatch("/assets/{id:guid}/status", UpdateAssetStatusAsync).AddEndpointFilter<AntiforgeryEndpointFilter>();
        admin.MapPost("/service-categories", CreateCategoryAsync).AddEndpointFilter<AntiforgeryEndpointFilter>();
        admin.MapPut("/service-categories/{id:guid}", UpdateCategoryAsync).AddEndpointFilter<AntiforgeryEndpointFilter>();
        admin.MapDelete("/service-categories/{id:guid}", DeleteCategoryAsync).AddEndpointFilter<AntiforgeryEndpointFilter>();
        admin.MapPost("/service-packages", CreatePackageAsync).AddEndpointFilter<AntiforgeryEndpointFilter>();
        admin.MapPut("/service-packages/{id:guid}", UpdatePackageAsync).AddEndpointFilter<AntiforgeryEndpointFilter>();
        admin.MapDelete("/service-packages/{id:guid}", DeletePackageAsync).AddEndpointFilter<AntiforgeryEndpointFilter>();
        return api;
    }

    private static async Task<IResult> GetCatalogAsync(
        HttpContext context,
        PortalDbContext db,
        CancellationToken cancellationToken)
    {
        var isAdmin = context.User.IsInRole(DemoRole.Administrator.ToString());
        var query = db.ServiceCategories.AsNoTracking().AsQueryable();
        if (!isAdmin) query = query.Where(x => x.IsActive);
        var categories = await query.OrderBy(x => x.DisplayOrder).ThenBy(x => x.Name).ToListAsync(cancellationToken);
        var packagesQuery = db.ServicePackages.AsNoTracking().Include(x => x.Features).AsQueryable();
        if (!isAdmin) packagesQuery = packagesQuery.Where(x => x.IsActive && x.Category.IsActive);
        var packages = await packagesQuery.OrderBy(x => x.MonthlyPrice).ToListAsync(cancellationToken);
        return Results.Ok(categories.Select(category => CategoryResponse.From(
            category,
            packages.Where(package => package.CategoryId == category.Id))));
    }

    private static async Task<IResult> GetAssetsAsync(
        HttpContext context,
        PortalDbContext db,
        WorkspaceContext workspaceContext,
        CancellationToken cancellationToken)
    {
        var query = db.ManagedAssets.AsNoTracking();
        if (!IsAdmin(context)) query = query.Where(x => x.OwnerPersonaId == workspaceContext.PersonaId);
        var records = await query.Include(x => x.ServicePackage).Include(x => x.OwnerPersona)
            .OrderBy(x => x.Name).ToListAsync(cancellationToken);
        return Results.Ok(records.Select(AssetResponse.From));
    }

    private static async Task<IResult> CreateAssetAsync(
        AssetWriteRequest request,
        HttpContext context,
        PortalDbContext db,
        WorkspaceContext workspaceContext,
        CancellationToken cancellationToken)
    {
        if (ValidateAsset(request) is { } invalid) return invalid;
        var package = await FindAssignablePackageAsync(db, request.ServicePackageId, cancellationToken);
        if (request.ServicePackageId is not null && package is null) return Invalid("servicePackageId", "Το επιλεγμένο πακέτο δεν είναι διαθέσιμο.");
        var ownerId = workspaceContext.PersonaId!.Value;
        if (IsAdmin(context))
        {
            ownerId = await db.DemoPersonas.Where(x => x.Role == DemoRole.Client && x.Status == PersonaStatus.Active)
                .Select(x => x.Id).FirstAsync(cancellationToken);
        }
        var asset = new ManagedAsset
        {
            Id = Guid.CreateVersion7(), WorkspaceId = workspaceContext.WorkspaceId!.Value, OwnerPersonaId = ownerId,
            ServicePackageId = package?.Id, Name = request.Name!.Trim(), AssetType = request.AssetType,
            Status = AssetStatus.Active, Url = NormalizeUrl(request.Url), CreatedAt = DateTimeOffset.UtcNow
        };
        db.ManagedAssets.Add(asset);
        await db.SaveChangesAsync(cancellationToken);
        await db.Entry(asset).Reference(x => x.ServicePackage).LoadAsync(cancellationToken);
        await db.Entry(asset).Reference(x => x.OwnerPersona).LoadAsync(cancellationToken);
        return Results.Created($"/api/v1/assets/{asset.Id}", AssetResponse.From(asset));
    }

    private static async Task<IResult> UpdateAssetAsync(
        Guid id,
        AssetWriteRequest request,
        HttpContext context,
        PortalDbContext db,
        WorkspaceContext workspaceContext,
        CancellationToken cancellationToken)
    {
        if (ValidateAsset(request) is { } invalid) return invalid;
        var asset = await db.ManagedAssets.Include(x => x.ServicePackage).Include(x => x.OwnerPersona)
            .SingleOrDefaultAsync(x => x.Id == id, cancellationToken);
        if (asset is null || (!IsAdmin(context) && asset.OwnerPersonaId != workspaceContext.PersonaId)) return Results.NotFound();
        var package = request.ServicePackageId is null
            ? null
            : await db.ServicePackages.SingleOrDefaultAsync(
                x => x.Id == request.ServicePackageId && ((x.IsActive && x.Category.IsActive) || x.Id == asset.ServicePackageId),
                cancellationToken);
        if (request.ServicePackageId is not null && package is null) return Invalid("servicePackageId", "Το επιλεγμένο πακέτο δεν είναι διαθέσιμο.");
        asset.Name = request.Name!.Trim(); asset.AssetType = request.AssetType;
        asset.Url = NormalizeUrl(request.Url); asset.ServicePackageId = package?.Id; asset.ServicePackage = package;
        await db.SaveChangesAsync(cancellationToken);
        return Results.Ok(AssetResponse.From(asset));
    }

    private static async Task<IResult> DeleteAssetAsync(
        Guid id,
        HttpContext context,
        PortalDbContext db,
        WorkspaceContext workspaceContext,
        CancellationToken cancellationToken)
    {
        var query = db.ManagedAssets.Where(x => x.Id == id);
        if (!IsAdmin(context)) query = query.Where(x => x.OwnerPersonaId == workspaceContext.PersonaId);
        return await query.ExecuteDeleteAsync(cancellationToken) == 1 ? Results.NoContent() : Results.NotFound();
    }

    private static async Task<IResult> UpdateAssetStatusAsync(
        Guid id, AssetStatusRequest request, PortalDbContext db, CancellationToken cancellationToken)
    {
        var updated = await db.ManagedAssets.Where(x => x.Id == id)
            .ExecuteUpdateAsync(change => change.SetProperty(x => x.Status, request.Status), cancellationToken);
        return updated == 1 ? Results.NoContent() : Results.NotFound();
    }

    private static async Task<IResult> CreateCategoryAsync(
        CategoryWriteRequest request, PortalDbContext db, WorkspaceContext workspaceContext, CancellationToken cancellationToken)
    {
        if (ValidateCategory(request) is { } invalid) return invalid;
        if (await db.ServiceCategories.AnyAsync(x => EF.Functions.ILike(x.Name, request.Name!.Trim()), cancellationToken))
            return Results.Conflict(new { message = "Υπάρχει ήδη κατηγορία με αυτό το όνομα." });
        var category = new ServiceCategory
        {
            Id = Guid.CreateVersion7(), WorkspaceId = workspaceContext.WorkspaceId!.Value, Name = request.Name!.Trim(),
            Color = request.Color!, DisplayOrder = request.DisplayOrder, IsActive = request.IsActive
        };
        db.ServiceCategories.Add(category); await db.SaveChangesAsync(cancellationToken);
        return Results.Created($"/api/v1/admin/service-categories/{category.Id}", CategoryResponse.From(category, []));
    }

    private static async Task<IResult> UpdateCategoryAsync(
        Guid id, CategoryWriteRequest request, PortalDbContext db, CancellationToken cancellationToken)
    {
        if (ValidateCategory(request) is { } invalid) return invalid;
        var category = await db.ServiceCategories.SingleOrDefaultAsync(x => x.Id == id, cancellationToken);
        if (category is null) return Results.NotFound();
        if (await db.ServiceCategories.AnyAsync(x => x.Id != id && EF.Functions.ILike(x.Name, request.Name!.Trim()), cancellationToken))
            return Results.Conflict(new { message = "Υπάρχει ήδη κατηγορία με αυτό το όνομα." });
        category.Name = request.Name!.Trim(); category.Color = request.Color!;
        category.DisplayOrder = request.DisplayOrder; category.IsActive = request.IsActive;
        await db.SaveChangesAsync(cancellationToken); return Results.NoContent();
    }

    private static async Task<IResult> DeleteCategoryAsync(Guid id, PortalDbContext db, CancellationToken cancellationToken)
    {
        if (await db.ServicePackages.AnyAsync(x => x.CategoryId == id, cancellationToken))
            return Results.Conflict(new { message = "Η κατηγορία περιέχει πακέτα και δεν μπορεί να διαγραφεί." });
        return await db.ServiceCategories.Where(x => x.Id == id).ExecuteDeleteAsync(cancellationToken) == 1
            ? Results.NoContent() : Results.NotFound();
    }

    private static async Task<IResult> CreatePackageAsync(
        PackageWriteRequest request, PortalDbContext db, WorkspaceContext workspaceContext, CancellationToken cancellationToken)
    {
        if (await ValidatePackageAsync(request, null, db, cancellationToken) is { } invalid) return invalid;
        var package = new ServicePackage
        {
            Id = Guid.CreateVersion7(), WorkspaceId = workspaceContext.WorkspaceId!.Value, CategoryId = request.CategoryId,
            Name = request.Name!.Trim(), Description = request.Description!.Trim(), MonthlyPrice = request.MonthlyPrice,
            Currency = "EUR", IsActive = request.IsActive
        };
        package.Features = request.Features!.Select((text, index) => new ServicePackageFeature
        {
            Id = Guid.CreateVersion7(), WorkspaceId = workspaceContext.WorkspaceId.Value,
            Position = index + 1, Text = text.Trim()
        }).ToList();
        db.ServicePackages.Add(package); await db.SaveChangesAsync(cancellationToken);
        return Results.Created($"/api/v1/admin/service-packages/{package.Id}", PackageResponse.From(package));
    }

    private static async Task<IResult> UpdatePackageAsync(
        Guid id, PackageWriteRequest request, PortalDbContext db, WorkspaceContext workspaceContext, CancellationToken cancellationToken)
    {
        if (await ValidatePackageAsync(request, id, db, cancellationToken) is { } invalid) return invalid;
        var package = await db.ServicePackages.Include(x => x.Features).SingleOrDefaultAsync(x => x.Id == id, cancellationToken);
        if (package is null) return Results.NotFound();
        package.CategoryId = request.CategoryId; package.Name = request.Name!.Trim(); package.Description = request.Description!.Trim();
        package.MonthlyPrice = request.MonthlyPrice; package.IsActive = request.IsActive;
        db.ServicePackageFeatures.RemoveRange(package.Features);
        package.Features = request.Features!.Select((text, index) => new ServicePackageFeature
        {
            Id = Guid.CreateVersion7(), WorkspaceId = workspaceContext.WorkspaceId!.Value,
            ServicePackageId = package.Id, Position = index + 1, Text = text.Trim()
        }).ToList();
        await db.SaveChangesAsync(cancellationToken); return Results.NoContent();
    }

    private static async Task<IResult> DeletePackageAsync(Guid id, PortalDbContext db, CancellationToken cancellationToken)
    {
        return await db.ServicePackages.Where(x => x.Id == id).ExecuteDeleteAsync(cancellationToken) == 1
            ? Results.NoContent() : Results.NotFound();
    }

    private static IResult? ValidateAsset(AssetWriteRequest request)
    {
        if (string.IsNullOrWhiteSpace(request.Name) || request.Name.Trim().Length is < 2 or > 160) return Invalid("name", "Το όνομα πρέπει να έχει από 2 έως 160 χαρακτήρες.");
        if (!string.IsNullOrWhiteSpace(request.Url) && (!Uri.TryCreate(request.Url.Trim(), UriKind.Absolute, out var uri) || uri.Scheme is not ("http" or "https")))
            return Invalid("url", "Η διεύθυνση πρέπει να είναι έγκυρο URL http ή https.");
        return null;
    }

    private static IResult? ValidateCategory(CategoryWriteRequest request)
    {
        if (string.IsNullOrWhiteSpace(request.Name) || request.Name.Trim().Length is < 2 or > 100) return Invalid("name", "Το όνομα πρέπει να έχει από 2 έως 100 χαρακτήρες.");
        if (string.IsNullOrWhiteSpace(request.Color) || !HexColor().IsMatch(request.Color)) return Invalid("color", "Το χρώμα πρέπει να έχει μορφή #2563eb.");
        if (request.DisplayOrder is < 0 or > 1000) return Invalid("displayOrder", "Η σειρά εμφάνισης δεν είναι έγκυρη.");
        return null;
    }

    private static async Task<IResult?> ValidatePackageAsync(PackageWriteRequest request, Guid? currentId, PortalDbContext db, CancellationToken cancellationToken)
    {
        if (string.IsNullOrWhiteSpace(request.Name) || request.Name.Trim().Length is < 2 or > 120) return Invalid("name", "Το όνομα πρέπει να έχει από 2 έως 120 χαρακτήρες.");
        if (string.IsNullOrWhiteSpace(request.Description) || request.Description.Trim().Length is < 5 or > 1000) return Invalid("description", "Η περιγραφή πρέπει να έχει από 5 έως 1.000 χαρακτήρες.");
        if (request.MonthlyPrice is < 0 or > 1_000_000) return Invalid("monthlyPrice", "Η τιμή δεν είναι έγκυρη.");
        if (request.Features is null || request.Features.Count > 12 || request.Features.Any(x => string.IsNullOrWhiteSpace(x) || x.Trim().Length > 240))
            return Invalid("features", "Επιτρέπονται έως 12 παροχές με έως 240 χαρακτήρες η καθεμία.");
        if (!await db.ServiceCategories.AnyAsync(x => x.Id == request.CategoryId, cancellationToken)) return Invalid("categoryId", "Η κατηγορία δεν υπάρχει.");
        if (await db.ServicePackages.AnyAsync(x => x.Id != currentId && EF.Functions.ILike(x.Name, request.Name!.Trim()), cancellationToken))
            return Results.Conflict(new { message = "Υπάρχει ήδη πακέτο με αυτό το όνομα." });
        return null;
    }

    private static async Task<ServicePackage?> FindAssignablePackageAsync(PortalDbContext db, Guid? id, CancellationToken cancellationToken) =>
        id is null ? null : await db.ServicePackages.SingleOrDefaultAsync(x => x.Id == id && x.IsActive && x.Category.IsActive, cancellationToken);
    private static string? NormalizeUrl(string? value) => string.IsNullOrWhiteSpace(value) ? null : value.Trim();
    private static bool IsAdmin(HttpContext context) => context.User.IsInRole(DemoRole.Administrator.ToString());
    private static IResult Invalid(string key, string message) => Results.ValidationProblem(new Dictionary<string, string[]> { [key] = [message] });
    [GeneratedRegex("^#[0-9a-fA-F]{6}$")]
    private static partial Regex HexColor();
}

public sealed record AssetWriteRequest(string? Name, AssetType AssetType, string? Url, Guid? ServicePackageId);
public sealed record AssetStatusRequest(AssetStatus Status);
public sealed record CategoryWriteRequest(string? Name, string? Color, int DisplayOrder, bool IsActive);
public sealed record PackageWriteRequest(Guid CategoryId, string? Name, string? Description, decimal MonthlyPrice, bool IsActive, IReadOnlyList<string>? Features);

public sealed record CategoryResponse(Guid Id, string Name, string Color, int DisplayOrder, bool IsActive, IReadOnlyList<PackageResponse> Packages)
{
    public static CategoryResponse From(ServiceCategory category, IEnumerable<ServicePackage> packages) =>
        new(category.Id, category.Name, category.Color, category.DisplayOrder, category.IsActive, packages.Select(PackageResponse.From).ToArray());
}

public sealed record PackageResponse(Guid Id, Guid CategoryId, string Name, string Description, decimal MonthlyPrice, string Currency, bool IsActive, IReadOnlyList<string> Features)
{
    public static PackageResponse From(ServicePackage package) =>
        new(package.Id, package.CategoryId, package.Name, package.Description, package.MonthlyPrice, package.Currency,
            package.IsActive, package.Features.OrderBy(x => x.Position).Select(x => x.Text).ToArray());
}

public sealed record AssetResponse(Guid Id, string Name, string Type, string TypeLabel, string Status, string? Url, Guid? ServicePackageId, string? PackageName, decimal? MonthlyPrice, string OwnerName)
{
    public static AssetResponse From(ManagedAsset asset) => new(
        asset.Id, asset.Name, asset.AssetType.ToString(), asset.AssetType switch
        {
            AssetType.Website => "Ιστοσελίδα", AssetType.Eshop => "Ηλεκτρονικό κατάστημα",
            AssetType.SocialMedia => "Κοινωνικά δίκτυα", AssetType.Seo => "SEO", _ => asset.AssetType.ToString()
        }, asset.Status == AssetStatus.Active ? "Ενεργό" : "Σε παύση", asset.Url, asset.ServicePackageId,
        asset.ServicePackage?.Name, asset.ServicePackage?.MonthlyPrice,
        asset.OwnerPersona is null ? "" : $"{asset.OwnerPersona.FirstName} {asset.OwnerPersona.LastName}");
}
