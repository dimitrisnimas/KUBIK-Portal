using System.Security.Claims;
using KubikPortal.Api.Data;
using Microsoft.AspNetCore.Authentication;
using Microsoft.AspNetCore.Authentication.Cookies;
using Microsoft.EntityFrameworkCore;

namespace KubikPortal.Api.Infrastructure;

public sealed class DemoSessionValidationMiddleware(RequestDelegate next)
{
    public async Task InvokeAsync(
        HttpContext context,
        PortalDbContext db,
        WorkspaceContext workspaceContext)
    {
        if (context.User.Identity?.IsAuthenticated != true)
        {
            await next(context);
            return;
        }

        var sessionValue = context.User.FindFirstValue(ClaimTypes.Sid);
        var workspaceValue = context.User.FindFirstValue("workspace_id");
        var personaValue = context.User.FindFirstValue("persona_id");
        if (!Guid.TryParse(sessionValue, out var sessionId)
            || !Guid.TryParse(workspaceValue, out var workspaceId)
            || !Guid.TryParse(personaValue, out var personaId))
        {
            await RejectAsync(context);
            return;
        }

        var now = DateTimeOffset.UtcNow;
        var session = await db.DemoSessions
            .IgnoreQueryFilters()
            .SingleOrDefaultAsync(x => x.Id == sessionId && x.WorkspaceId == workspaceId, context.RequestAborted);
        if (session is null || session.RevokedAt is not null || session.ExpiresAt <= now)
        {
            if (session is not null)
            {
                await db.DemoWorkspaces.Where(x => x.Id == workspaceId).ExecuteDeleteAsync(context.RequestAborted);
            }
            await RejectAsync(context);
            return;
        }

        workspaceContext.Set(workspaceId, personaId);
        if (session.LastSeenAt < now.AddMinutes(-1))
        {
            session.LastSeenAt = now;
            var workspace = await db.DemoWorkspaces.FindAsync([workspaceId], context.RequestAborted);
            if (workspace is not null) workspace.LastSeenAt = now;
            await db.SaveChangesAsync(context.RequestAborted);
        }

        await next(context);
    }

    private static async Task RejectAsync(HttpContext context)
    {
        await context.SignOutAsync(CookieAuthenticationDefaults.AuthenticationScheme);
        context.Response.StatusCode = StatusCodes.Status401Unauthorized;
        await context.Response.WriteAsJsonAsync(new
        {
            title = "Η συνεδρία έληξε",
            detail = "Ξεκινήστε μια νέα δοκιμαστική συνεδρία."
        });
    }
}
