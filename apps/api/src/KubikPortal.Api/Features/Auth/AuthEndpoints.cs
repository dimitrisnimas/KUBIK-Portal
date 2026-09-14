using System.ComponentModel.DataAnnotations;
using System.Globalization;
using System.Security.Claims;
using System.Security.Cryptography;
using KubikPortal.Api.Data;
using KubikPortal.Api.Domain;
using KubikPortal.Api.Infrastructure;
using Microsoft.AspNetCore.Antiforgery;
using Microsoft.AspNetCore.Authentication;
using Microsoft.AspNetCore.Authentication.Cookies;
using Microsoft.EntityFrameworkCore;
using Microsoft.Extensions.Options;

namespace KubikPortal.Api.Features.Auth;

public static class AuthEndpoints
{
    public static RouteGroupBuilder MapAuthEndpoints(this RouteGroupBuilder api)
    {
        var auth = api.MapGroup("/auth");
        auth.MapPost("/request-code", RequestCodeAsync).RequireRateLimiting("otp");
        auth.MapPost("/verify-code", VerifyCodeAsync).RequireRateLimiting("otp");
        auth.MapPost("/logout", LogoutAsync).RequireAuthorization();
        api.MapGet("/session", GetSessionAsync).RequireAuthorization();
        return api;
    }

    private static async Task<IResult> RequestCodeAsync(
        RequestCodeRequest request,
        PortalDbContext db,
        OtpCodeProtector protector,
        OtpDeliveryService delivery,
        IOptions<DemoOptions> options,
        CancellationToken cancellationToken)
    {
        if (!options.Value.Enabled) return Results.NotFound();
        var email = request.Email?.Trim().ToLowerInvariant();
        if (string.IsNullOrWhiteSpace(email) || !new EmailAddressAttribute().IsValid(email))
        {
            return Results.ValidationProblem(new Dictionary<string, string[]> { ["email"] = ["Εισαγάγετε έγκυρη διεύθυνση email."] });
        }
        if (!Enum.IsDefined(request.Role))
            return Results.ValidationProblem(new Dictionary<string, string[]> { ["role"] = ["Ο δοκιμαστικός ρόλος δεν είναι έγκυρος."] });

        var latest = await db.OtpChallenges.Where(x => x.Email == email)
            .OrderByDescending(x => x.CreatedAt).FirstOrDefaultAsync(cancellationToken);
        var now = DateTimeOffset.UtcNow;
        if (latest is not null && latest.CreatedAt > now.AddSeconds(-options.Value.OtpResendSeconds))
        {
            return Results.Problem("Περιμένετε λίγο πριν ζητήσετε νέο κωδικό.", statusCode: StatusCodes.Status429TooManyRequests);
        }

        var challengeId = Guid.CreateVersion7();
        var code = RandomNumberGenerator.GetInt32(0, 1_000_000).ToString("D6", CultureInfo.InvariantCulture);
        var challenge = new OtpChallenge
        {
            Id = challengeId,
            Email = email,
            RequestedRole = request.Role,
            CodeHash = protector.Hash(challengeId, code),
            CreatedAt = now,
            ExpiresAt = now.AddMinutes(options.Value.OtpLifetimeMinutes)
        };
        db.OtpChallenges.Add(challenge);
        await db.SaveChangesAsync(cancellationToken);

        var developmentCode = await delivery.SendAsync(email, code, cancellationToken);
        return Results.Ok(new RequestCodeResponse(challengeId, challenge.ExpiresAt, developmentCode));
    }

    private static async Task<IResult> VerifyCodeAsync(
        VerifyCodeRequest request,
        HttpContext httpContext,
        PortalDbContext db,
        OtpCodeProtector protector,
        DemoWorkspaceFactory workspaceFactory,
        IAntiforgery antiforgery,
        IOptions<DemoOptions> options,
        CancellationToken cancellationToken)
    {
        if (!options.Value.Enabled) return Results.NotFound();
        var challenge = await db.OtpChallenges.SingleOrDefaultAsync(x => x.Id == request.ChallengeId, cancellationToken);
        var now = DateTimeOffset.UtcNow;
        if (challenge is null || challenge.ConsumedAt is not null || challenge.ExpiresAt <= now || challenge.FailedAttempts >= 5)
        {
            return Results.BadRequest(new { message = "Ο κωδικός δεν είναι πλέον έγκυρος." });
        }
        if (request.Code is null || request.Code.Length != 6 || !protector.Verify(challenge.Id, request.Code, challenge.CodeHash))
        {
            challenge.FailedAttempts++;
            await db.SaveChangesAsync(cancellationToken);
            return Results.BadRequest(new { message = "Ο κωδικός δεν είναι σωστός." });
        }

        await using var transaction = await db.Database.BeginTransactionAsync(cancellationToken);
        var consumed = await db.OtpChallenges
            .Where(x => x.Id == challenge.Id && x.ConsumedAt == null)
            .ExecuteUpdateAsync(update => update.SetProperty(x => x.ConsumedAt, now), cancellationToken);
        if (consumed != 1)
        {
            return Results.Conflict(new { message = "Ο κωδικός έχει ήδη χρησιμοποιηθεί." });
        }

        var created = await workspaceFactory.CreateAsync(challenge.Email, challenge.RequestedRole, cancellationToken);
        await transaction.CommitAsync(cancellationToken);

        var claims = new[]
        {
            new Claim(ClaimTypes.Sid, created.Session.Id.ToString()),
            new Claim("workspace_id", created.Workspace.Id.ToString()),
            new Claim("persona_id", created.Persona.Id.ToString()),
            new Claim(ClaimTypes.Role, created.Persona.Role.ToString()),
            new Claim(ClaimTypes.Name, $"{created.Persona.FirstName} {created.Persona.LastName}"),
            new Claim(ClaimTypes.Email, created.Workspace.VerifiedEmail)
        };
        await httpContext.SignInAsync(
            CookieAuthenticationDefaults.AuthenticationScheme,
            new ClaimsPrincipal(new ClaimsIdentity(claims, CookieAuthenticationDefaults.AuthenticationScheme)),
            new AuthenticationProperties { IsPersistent = false, ExpiresUtc = created.Session.ExpiresAt });

        var csrfToken = antiforgery.GetAndStoreTokens(httpContext).RequestToken!;
        return Results.Ok(SessionResponse.From(created.Persona, created.Workspace, csrfToken));
    }

    private static async Task<IResult> GetSessionAsync(
        HttpContext context,
        PortalDbContext db,
        WorkspaceContext workspaceContext,
        IAntiforgery antiforgery,
        CancellationToken cancellationToken)
    {
        var persona = await db.DemoPersonas.SingleAsync(x => x.Id == workspaceContext.PersonaId, cancellationToken);
        var workspace = await db.DemoWorkspaces.SingleAsync(x => x.Id == workspaceContext.WorkspaceId, cancellationToken);
        var csrfToken = antiforgery.GetAndStoreTokens(context).RequestToken!;
        return Results.Ok(SessionResponse.From(persona, workspace, csrfToken));
    }

    private static async Task<IResult> LogoutAsync(
        HttpContext context,
        PortalDbContext db,
        WorkspaceContext workspaceContext,
        IAntiforgery antiforgery,
        CancellationToken cancellationToken)
    {
        try
        {
            await antiforgery.ValidateRequestAsync(context);
        }
        catch (AntiforgeryValidationException)
        {
            return Results.BadRequest(new { message = "Η επιβεβαίωση ασφαλείας έληξε. Ανανεώστε τη σελίδα." });
        }
        if (workspaceContext.WorkspaceId is Guid workspaceId)
        {
            await db.DemoWorkspaces.Where(x => x.Id == workspaceId).ExecuteDeleteAsync(cancellationToken);
        }
        await context.SignOutAsync(CookieAuthenticationDefaults.AuthenticationScheme);
        return Results.NoContent();
    }
}

public sealed record RequestCodeRequest(string? Email, DemoRole Role);
public sealed record RequestCodeResponse(Guid ChallengeId, DateTimeOffset ExpiresAt, string? DevelopmentCode);
public sealed record VerifyCodeRequest(Guid ChallengeId, string? Code);
public sealed record SessionResponse(Guid WorkspaceId, DemoRole Role, string DisplayName, string Email, DateTimeOffset ExpiresAt, string CsrfToken)
{
    public static SessionResponse From(DemoPersona persona, DemoWorkspace workspace, string csrfToken) =>
        new(workspace.Id, persona.Role, $"{persona.FirstName} {persona.LastName}", workspace.VerifiedEmail, workspace.ExpiresAt, csrfToken);
}
