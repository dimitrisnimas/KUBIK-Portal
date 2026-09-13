using KubikPortal.Api.Data;
using Microsoft.EntityFrameworkCore;
using Microsoft.Extensions.Options;

namespace KubikPortal.Api.Infrastructure;

public sealed class ExpiredWorkspaceCleanupService(
    IServiceScopeFactory scopeFactory,
    IOptions<DemoOptions> options,
    ILogger<ExpiredWorkspaceCleanupService> logger) : BackgroundService
{
    protected override async Task ExecuteAsync(CancellationToken stoppingToken)
    {
        using var timer = new PeriodicTimer(TimeSpan.FromMinutes(Math.Max(1, options.Value.CleanupIntervalMinutes)));
        while (!stoppingToken.IsCancellationRequested)
        {
            try
            {
                await RemoveExpiredAsync(stoppingToken);
                await timer.WaitForNextTickAsync(stoppingToken);
            }
            catch (OperationCanceledException) when (stoppingToken.IsCancellationRequested)
            {
                break;
            }
            catch (Exception exception)
            {
                logger.LogError(exception, "Η εκκαθάριση ληγμένων demo workspaces απέτυχε.");
                await Task.Delay(TimeSpan.FromMinutes(1), stoppingToken);
            }
        }
    }

    private async Task RemoveExpiredAsync(CancellationToken cancellationToken)
    {
        await using var scope = scopeFactory.CreateAsyncScope();
        var db = scope.ServiceProvider.GetRequiredService<PortalDbContext>();
        var expiredIds = await db.DemoWorkspaces
            .Where(x => x.ExpiresAt <= DateTimeOffset.UtcNow)
            .OrderBy(x => x.ExpiresAt)
            .Select(x => x.Id)
            .Take(100)
            .ToListAsync(cancellationToken);
        if (expiredIds.Count > 0)
        {
            var deleted = await db.DemoWorkspaces.Where(x => expiredIds.Contains(x.Id)).ExecuteDeleteAsync(cancellationToken);
            logger.LogInformation("Διαγράφηκαν {WorkspaceCount} ληγμένα demo workspaces.", deleted);
        }
        await db.OtpChallenges
            .Where(x => x.ExpiresAt < DateTimeOffset.UtcNow.AddDays(-1))
            .ExecuteDeleteAsync(cancellationToken);
    }
}
