using System.Threading.RateLimiting;
using System.Text.Json.Serialization;
using System.Text.Json;
using System.Diagnostics;
using KubikPortal.Api.Data;
using KubikPortal.Api.Features.Auth;
using KubikPortal.Api.Features.Catalog;
using KubikPortal.Api.Features.Dashboard;
using KubikPortal.Api.Features.Tickets;
using KubikPortal.Api.Features.Billing;
using KubikPortal.Api.Infrastructure;
using Microsoft.AspNetCore.Authentication.Cookies;
using Microsoft.AspNetCore.HttpOverrides;
using Microsoft.EntityFrameworkCore;

var builder = WebApplication.CreateBuilder(args);

var connectionString = PostgresConnection.Normalize(
    builder.Configuration.GetConnectionString("Portal")
        ?? throw new InvalidOperationException("Η σύνδεση ConnectionStrings:Portal δεν έχει οριστεί."));

builder.Services.AddHttpContextAccessor();
builder.Services.AddScoped<WorkspaceContext>();
builder.Services.AddScoped<IWorkspaceContext>(sp => sp.GetRequiredService<WorkspaceContext>());
builder.Services.AddDbContext<PortalDbContext>(options => options.UseNpgsql(connectionString));
builder.Services.AddDatabaseDeveloperPageExceptionFilter();
builder.Services.AddOptions<DemoOptions>()
    .Bind(builder.Configuration.GetSection(DemoOptions.SectionName))
    .Validate(options => options.WorkspaceLifetimeMinutes is >= 5 and <= 240, "Το demo workspace lifetime πρέπει να είναι από 5 έως 240 λεπτά.")
    .Validate(options => options.OtpLifetimeMinutes is >= 2 and <= 30, "Το OTP lifetime πρέπει να είναι από 2 έως 30 λεπτά.")
    .Validate(options => options.OtpResendSeconds is >= 15 and <= 600, "Το OTP resend interval πρέπει να είναι από 15 έως 600 δευτερόλεπτα.")
    .Validate(options => options.CleanupIntervalMinutes is >= 1 and <= 60, "Το cleanup interval πρέπει να είναι από 1 έως 60 λεπτά.")
    .ValidateOnStart();
builder.Services.AddOptions<SmtpOptions>()
    .Bind(builder.Configuration.GetSection(SmtpOptions.SectionName))
    .Validate(options => !builder.Environment.IsProduction() ||
        (!string.IsNullOrWhiteSpace(options.Host) && !string.IsNullOrWhiteSpace(options.FromAddress)),
        "Τα Smtp:Host και Smtp:FromAddress είναι υποχρεωτικά στην παραγωγή.")
    .Validate(options => string.IsNullOrWhiteSpace(options.Username) || !string.IsNullOrWhiteSpace(options.Password),
        "Το Smtp:Password είναι υποχρεωτικό όταν έχει οριστεί Smtp:Username.")
    .ValidateOnStart();
if (builder.Environment.IsProduction() && (builder.Configuration["Demo:OtpHashSecret"]?.Length ?? 0) < 32)
    throw new InvalidOperationException("Το Demo:OtpHashSecret πρέπει να έχει τουλάχιστον 32 χαρακτήρες στην παραγωγή.");
builder.Services.AddSingleton<OtpCodeProtector>();
builder.Services.AddScoped<OtpDeliveryService>();
builder.Services.AddScoped<DemoWorkspaceFactory>();
builder.Services.AddSingleton<InvoicePdfGenerator>();
builder.Services.AddHostedService<ExpiredWorkspaceCleanupService>();

builder.Services.AddAuthentication(CookieAuthenticationDefaults.AuthenticationScheme)
    .AddCookie(options =>
    {
        options.Cookie.Name = "__Host-kubik_demo";
        options.Cookie.HttpOnly = true;
        options.Cookie.SameSite = SameSiteMode.Lax;
        options.Cookie.SecurePolicy = CookieSecurePolicy.Always;
        options.SlidingExpiration = false;
        options.Events.OnRedirectToLogin = context =>
        {
            context.Response.StatusCode = StatusCodes.Status401Unauthorized;
            return Task.CompletedTask;
        };
        options.Events.OnRedirectToAccessDenied = context =>
        {
            context.Response.StatusCode = StatusCodes.Status403Forbidden;
            return Task.CompletedTask;
        };
    });
builder.Services.AddAuthorization();
builder.Services.AddAntiforgery(options =>
{
    options.Cookie.Name = "__Host-kubik_csrf";
    options.Cookie.HttpOnly = true;
    options.Cookie.SameSite = SameSiteMode.Strict;
    options.Cookie.SecurePolicy = CookieSecurePolicy.Always;
    options.HeaderName = "X-CSRF-TOKEN";
});
builder.Services.AddRateLimiter(options =>
{
    options.RejectionStatusCode = StatusCodes.Status429TooManyRequests;
    options.AddPolicy("otp", context => RateLimitPartition.GetFixedWindowLimiter(
        context.Connection.RemoteIpAddress?.ToString() ?? "unknown",
        _ => new FixedWindowRateLimiterOptions
        {
            PermitLimit = 5,
            Window = TimeSpan.FromMinutes(10),
            QueueLimit = 0
        }));
});
builder.Services.AddProblemDetails(options => options.CustomizeProblemDetails = context =>
{
    context.ProblemDetails.Extensions["traceId"] = Activity.Current?.TraceId.ToString() ?? context.HttpContext.TraceIdentifier;
});
builder.Services.ConfigureHttpJsonOptions(options =>
{
    options.SerializerOptions.Converters.Add(new JsonStringEnumConverter(allowIntegerValues: false));
    options.SerializerOptions.UnmappedMemberHandling = JsonUnmappedMemberHandling.Disallow;
});
builder.Services.AddOpenApi();
builder.Services.AddHealthChecks();

var app = builder.Build();
var forwardedHeaders = new ForwardedHeadersOptions
{
    ForwardedHeaders = ForwardedHeaders.XForwardedFor | ForwardedHeaders.XForwardedProto,
    ForwardLimit = 1
};
forwardedHeaders.KnownIPNetworks.Clear();
forwardedHeaders.KnownProxies.Clear();
app.UseForwardedHeaders(forwardedHeaders);
if (!app.Environment.IsDevelopment()) app.UseHsts();
app.UseMiddleware<RequestDiagnosticsMiddleware>();
app.UseExceptionHandler();
app.UseStatusCodePages();
app.UseMiddleware<SecurityHeadersMiddleware>();
app.UseHttpsRedirection();
app.UseRateLimiter();
app.UseAuthentication();
app.UseMiddleware<DemoSessionValidationMiddleware>();
app.UseAuthorization();
app.UseAntiforgery();

if (app.Environment.IsDevelopment())
{
    app.MapOpenApi();
}

app.MapGet("/health", () => Results.Ok(new { status = "ok" }));
app.MapGet("/health/ready", async (PortalDbContext db, CancellationToken cancellationToken) =>
    await db.Database.CanConnectAsync(cancellationToken)
        ? Results.Ok(new { status = "ready" })
        : Results.Problem("Η βάση δεδομένων δεν είναι διαθέσιμη.", statusCode: StatusCodes.Status503ServiceUnavailable));
var api = app.MapGroup("/api/v1");
api.MapAuthEndpoints();
api.MapDashboardEndpoints();
api.MapCatalogEndpoints();
api.MapTicketEndpoints();
api.MapBillingEndpoints();

await app.Services.ApplyDatabaseMigrationsAsync();
app.Run();

public partial class Program;
