using System.Net;
using System.Net.Http.Json;
using System.Text.Json;
using KubikPortal.Api.Data;
using Microsoft.AspNetCore.Hosting;
using Microsoft.AspNetCore.Mvc.Testing;
using Microsoft.EntityFrameworkCore;
using Microsoft.Extensions.Configuration;
using Microsoft.Extensions.DependencyInjection;
using Testcontainers.PostgreSql;

namespace KubikPortal.Api.Tests;

public sealed class DemoWorkspaceFlowTests : IAsyncLifetime
{
    private readonly PostgreSqlContainer _postgres = new PostgreSqlBuilder("postgres:17-alpine").Build();
    private PortalFactory _factory = null!;

    public async Task InitializeAsync()
    {
        await _postgres.StartAsync();
        _factory = new PortalFactory(_postgres.GetConnectionString());
    }

    public async Task DisposeAsync()
    {
        await _factory.DisposeAsync();
        await _postgres.DisposeAsync();
    }

    [Fact]
    public async Task ConcurrentVisitorsReceiveIsolatedDeterministicWorkspaces()
    {
        var firstClient = CreateClient();
        var secondClient = CreateClient();
        var first = await VerifyAsync(firstClient, "first@example.com", "Client");
        var second = await VerifyAsync(secondClient, "second@example.com", "Client");

        Assert.NotEqual(first.WorkspaceId, second.WorkspaceId);
        var firstAssets = await firstClient.GetFromJsonAsync<JsonElement[]>("/api/v1/assets");
        var secondAssets = await secondClient.GetFromJsonAsync<JsonElement[]>("/api/v1/assets");
        Assert.Equal(3, firstAssets!.Length);
        Assert.Equal(3, secondAssets!.Length);
        Assert.Empty(firstAssets.Select(x => x.GetProperty("id").GetGuid()).Intersect(secondAssets.Select(x => x.GetProperty("id").GetGuid())));
        Assert.Equal(
            firstAssets.Select(x => x.GetProperty("name").GetString()).Order(),
            secondAssets.Select(x => x.GetProperty("name").GetString()).Order());
    }

    [Fact]
    public async Task LogoutDeletesWorkspaceAndInvalidatesSession()
    {
        var client = CreateClient();
        var session = await VerifyAsync(client, "logout@example.com", "Administrator");
        using var logout = new HttpRequestMessage(HttpMethod.Post, "/api/v1/auth/logout");
        logout.Headers.Add("X-CSRF-TOKEN", session.CsrfToken);
        var logoutResponse = await client.SendAsync(logout);
        Assert.Equal(HttpStatusCode.NoContent, logoutResponse.StatusCode);
        Assert.Equal(HttpStatusCode.Unauthorized, (await client.GetAsync("/api/v1/session")).StatusCode);

        await using var scope = _factory.Services.CreateAsyncScope();
        var db = scope.ServiceProvider.GetRequiredService<PortalDbContext>();
        Assert.False(await db.DemoWorkspaces.AnyAsync(x => x.Id == session.WorkspaceId));
    }

    private HttpClient CreateClient() => _factory.CreateClient(new WebApplicationFactoryClientOptions
    {
        BaseAddress = new Uri("https://localhost"),
        AllowAutoRedirect = false,
        HandleCookies = true
    });

    private static async Task<TestSession> VerifyAsync(HttpClient client, string email, string role)
    {
        var request = await client.PostAsJsonAsync("/api/v1/auth/request-code", new { email, role });
        request.EnsureSuccessStatusCode();
        var challenge = await request.Content.ReadFromJsonAsync<JsonElement>();
        var verify = await client.PostAsJsonAsync("/api/v1/auth/verify-code", new
        {
            challengeId = challenge.GetProperty("challengeId").GetGuid(),
            code = challenge.GetProperty("developmentCode").GetString()
        });
        verify.EnsureSuccessStatusCode();
        return (await verify.Content.ReadFromJsonAsync<TestSession>())!;
    }

    private sealed record TestSession(Guid WorkspaceId, string CsrfToken);

    private sealed class PortalFactory(string connectionString) : WebApplicationFactory<Program>
    {
        protected override void ConfigureWebHost(IWebHostBuilder builder)
        {
            builder.UseEnvironment("Development");
            builder.ConfigureAppConfiguration((_, configuration) => configuration.AddInMemoryCollection(new Dictionary<string, string?>
            {
                ["ConnectionStrings:Portal"] = connectionString,
                ["Demo:Enabled"] = "true",
                ["Demo:RevealOtpInDevelopment"] = "true",
                ["Demo:WorkspaceLifetimeMinutes"] = "30"
            }));
        }
    }
}
