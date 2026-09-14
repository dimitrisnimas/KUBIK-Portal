using KubikPortal.Api.Data;
using KubikPortal.Api.Domain;
using KubikPortal.Api.Features.Catalog;
using Microsoft.EntityFrameworkCore;

namespace KubikPortal.Api.Features.Dashboard;

public static class DashboardEndpoints
{
    public static RouteGroupBuilder MapDashboardEndpoints(this RouteGroupBuilder api)
    {
        api.MapGet("/dashboard", GetDashboardAsync).RequireAuthorization();
        return api;
    }

    private static async Task<IResult> GetDashboardAsync(
        HttpContext context,
        PortalDbContext db,
        WorkspaceContext workspaceContext,
        CancellationToken cancellationToken)
    {
        var isAdministrator = context.User.IsInRole(DemoRole.Administrator.ToString());
        var assetsQuery = db.ManagedAssets.AsNoTracking();
        if (!isAdministrator) assetsQuery = assetsQuery.Where(x => x.OwnerPersonaId == workspaceContext.PersonaId);

        var assets = await assetsQuery.Include(x => x.ServicePackage).OrderBy(x => x.Name).ToListAsync(cancellationToken);
        var activeAssets = assets.Count(x => x.Status == AssetStatus.Active);
        var monthlyTotal = assets.Where(x => x.Status == AssetStatus.Active).Sum(x => x.ServicePackage?.MonthlyPrice ?? 0m);
        var clientCount = isAdministrator
            ? await db.DemoPersonas.CountAsync(x => x.Role == DemoRole.Client && x.Status == PersonaStatus.Active, cancellationToken)
            : 1;
        return Results.Ok(new DashboardResponse(
            isAdministrator ? "Administrator" : "Client",
            assets.Count,
            activeAssets,
            clientCount,
            monthlyTotal,
            assets.Take(3).Select(AssetResponse.From).ToArray()));
    }

}

public sealed record DashboardResponse(
    string Role,
    int AssetCount,
    int ActiveAssetCount,
    int ClientCount,
    decimal MonthlyTotal,
    IReadOnlyList<AssetResponse> RecentAssets);
