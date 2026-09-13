using KubikPortal.Api.Data;
using Microsoft.EntityFrameworkCore;

namespace KubikPortal.Api.Infrastructure;

public static class DatabaseExtensions
{
    public static async Task ApplyDatabaseMigrationsAsync(this IServiceProvider services)
    {
        await using var scope = services.CreateAsyncScope();
        var db = scope.ServiceProvider.GetRequiredService<PortalDbContext>();
        await db.Database.MigrateAsync();
    }
}
