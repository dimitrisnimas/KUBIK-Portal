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

    [Fact]
    public async Task ClientAndAdministratorCatalogPermissionsAreEnforced()
    {
        var client = CreateClient();
        var clientSession = await VerifyAsync(client, "client-catalog@example.com", "Client");
        var catalog = await client.GetFromJsonAsync<JsonElement[]>("/api/v1/catalog");
        var packageId = catalog![0].GetProperty("packages")[0].GetProperty("id").GetGuid();
        var createAsset = await SendWithCsrfAsync(client, HttpMethod.Post, "/api/v1/assets", clientSession.CsrfToken, new
        {
            name = "Νέο δοκιμαστικό έργο", assetType = "Website", url = "https://new.example.gr", servicePackageId = packageId
        });
        Assert.Equal(HttpStatusCode.Created, createAsset.StatusCode);
        Assert.Equal(4, (await client.GetFromJsonAsync<JsonElement[]>("/api/v1/assets"))!.Length);

        var forbidden = await SendWithCsrfAsync(client, HttpMethod.Post, "/api/v1/admin/service-categories", clientSession.CsrfToken, new
        {
            name = "Μη επιτρεπτή", color = "#2563eb", displayOrder = 10, isActive = true
        });
        Assert.Equal(HttpStatusCode.Forbidden, forbidden.StatusCode);

        var administrator = CreateClient();
        var adminSession = await VerifyAsync(administrator, "admin-catalog@example.com", "Administrator");
        var createCategory = await SendWithCsrfAsync(administrator, HttpMethod.Post, "/api/v1/admin/service-categories", adminSession.CsrfToken, new
        {
            name = "Νέα κατηγορία", color = "#0f766e", displayOrder = 3, isActive = true
        });
        Assert.Equal(HttpStatusCode.Created, createCategory.StatusCode);
        var category = await createCategory.Content.ReadFromJsonAsync<JsonElement>();
        var categoryId = category.GetProperty("id").GetGuid();
        var createPackage = await SendWithCsrfAsync(administrator, HttpMethod.Post, "/api/v1/admin/service-packages", adminSession.CsrfToken, new
        {
            categoryId, name = "Νέο πακέτο", description = "Περιγραφή δοκιμαστικού πακέτου.", monthlyPrice = 125.50m,
            isActive = true, features = new[] { "Πρώτη παροχή", "Δεύτερη παροχή" }
        });
        Assert.Equal(HttpStatusCode.Created, createPackage.StatusCode);
        var package = await createPackage.Content.ReadFromJsonAsync<JsonElement>();
        Assert.Equal(2, package.GetProperty("features").GetArrayLength());
    }

    [Fact]
    public async Task TicketBillingAndTransitionRulesAreServerEnforced()
    {
        var client = CreateClient();
        var clientSession = await VerifyAsync(client, "ticket-client@example.com", "Client");
        var rejectedClientBilling = await SendWithCsrfAsync(client, HttpMethod.Post, "/api/v1/tickets", clientSession.CsrfToken, new
        {
            title = "Αίτημα με μη επιτρεπτό πεδίο", message = "Το αίτημα πρέπει να απορριφθεί.",
            kind = "Support", priority = "Normal", managedAssetId = (Guid?)null, chargeable = true
        });
        Assert.Equal(HttpStatusCode.BadRequest, rejectedClientBilling.StatusCode);

        var createTicket = await SendWithCsrfAsync(client, HttpMethod.Post, "/api/v1/tickets", clientSession.CsrfToken, new
        {
            title = "Νέο αίτημα υποστήριξης", message = "Παρακαλώ ελέγξτε τη συγκεκριμένη λειτουργία.",
            kind = "Support", priority = "High", managedAssetId = (Guid?)null
        });
        Assert.Equal(HttpStatusCode.Created, createTicket.StatusCode);
        var created = await createTicket.Content.ReadFromJsonAsync<JsonElement>();
        var ticketId = created.GetProperty("id").GetGuid();
        Assert.Equal(HttpStatusCode.Forbidden, (await SendWithCsrfAsync(
            client, HttpMethod.Post, $"/api/v1/admin/tickets/{ticketId}/billing-decisions", clientSession.CsrfToken,
            new { decision = "Covered", price = (decimal?)null, note = "Δεν επιτρέπεται." })).StatusCode);

        var administrator = CreateClient();
        var adminSession = await VerifyAsync(administrator, "ticket-admin@example.com", "Administrator");
        var tickets = await administrator.GetFromJsonAsync<JsonElement[]>("/api/v1/tickets");
        var seededNewTicket = tickets!.Single(x => x.GetProperty("status").GetString() == "New");
        var seededId = seededNewTicket.GetProperty("id").GetGuid();
        var invalidTransition = await SendWithCsrfAsync(administrator, HttpMethod.Patch,
            $"/api/v1/admin/tickets/{seededId}/status", adminSession.CsrfToken, new { status = "Resolved" });
        Assert.Equal(HttpStatusCode.Conflict, invalidTransition.StatusCode);
        Assert.Equal(HttpStatusCode.NoContent, (await SendWithCsrfAsync(administrator, HttpMethod.Patch,
            $"/api/v1/admin/tickets/{seededId}/status", adminSession.CsrfToken, new { status = "InProgress" })).StatusCode);

        var missingPrice = await SendWithCsrfAsync(administrator, HttpMethod.Post,
            $"/api/v1/admin/tickets/{seededId}/billing-decisions", adminSession.CsrfToken,
            new { decision = "Chargeable", price = (decimal?)null, note = "Χρειάζεται εκτίμηση." });
        Assert.Equal(HttpStatusCode.BadRequest, missingPrice.StatusCode);
        var validDecision = await SendWithCsrfAsync(administrator, HttpMethod.Post,
            $"/api/v1/admin/tickets/{seededId}/billing-decisions", adminSession.CsrfToken,
            new { decision = "Chargeable", price = 320m, note = "Εγκεκριμένη εκτίμηση demo." });
        Assert.Equal(HttpStatusCode.Created, validDecision.StatusCode);
        var detail = await administrator.GetFromJsonAsync<JsonElement>($"/api/v1/tickets/{seededId}");
        Assert.True(detail.GetProperty("billingDecisions").GetArrayLength() >= 2);
    }

    [Fact]
    public async Task PaymentDeclarationsRequireAdminReviewBeforeAnInvoiceBecomesPaid()
    {
        var client = CreateClient();
        var clientSession = await VerifyAsync(client, "billing-client@example.com", "Client");
        var clientInvoices = await client.GetFromJsonAsync<JsonElement[]>("/api/v1/invoices");
        var overdue = clientInvoices!.Single(x => x.GetProperty("number").GetString() == "KINV-2026-002");
        var overdueId = overdue.GetProperty("id").GetGuid();

        var rejectedBillingField = await SendWithCsrfAsync(client, HttpMethod.Post,
            $"/api/v1/invoices/{overdueId}/payment-declarations", clientSession.CsrfToken,
            new { reference = "TRX-CLIENT-001", note = "Δοκιμή", status = "Approved" });
        Assert.Equal(HttpStatusCode.BadRequest, rejectedBillingField.StatusCode);

        var submitted = await SendWithCsrfAsync(client, HttpMethod.Post,
            $"/api/v1/invoices/{overdueId}/payment-declarations", clientSession.CsrfToken,
            new { reference = "TRX-CLIENT-001", note = "Μεταφορά από demo λογαριασμό." });
        Assert.Equal(HttpStatusCode.Created, submitted.StatusCode);
        var stillUnpaid = await client.GetFromJsonAsync<JsonElement>($"/api/v1/invoices/{overdueId}");
        Assert.Equal("Unpaid", stillUnpaid.GetProperty("status").GetString());
        Assert.Contains(stillUnpaid.GetProperty("paymentDeclarations").EnumerateArray(),
            x => x.GetProperty("status").GetString() == "PendingReview");
        Assert.Equal(HttpStatusCode.Conflict, (await SendWithCsrfAsync(client, HttpMethod.Post,
            $"/api/v1/invoices/{overdueId}/payment-declarations", clientSession.CsrfToken,
            new { reference = "TRX-CLIENT-002", note = (string?)null })).StatusCode);

        var administrator = CreateClient();
        var adminSession = await VerifyAsync(administrator, "billing-admin@example.com", "Administrator");
        var pending = await administrator.GetFromJsonAsync<JsonElement[]>("/api/v1/admin/payment-declarations?status=PendingReview");
        var declaration = Assert.Single(pending!);
        var declarationId = declaration.GetProperty("id").GetGuid();
        var invoiceId = declaration.GetProperty("invoiceId").GetGuid();

        var pdf = await administrator.GetAsync($"/api/v1/invoices/{invoiceId}/pdf");
        pdf.EnsureSuccessStatusCode();
        Assert.Equal("application/pdf", pdf.Content.Headers.ContentType?.MediaType);
        Assert.Equal("%PDF-", System.Text.Encoding.ASCII.GetString((await pdf.Content.ReadAsByteArrayAsync())[..5]));

        var approved = await SendWithCsrfAsync(administrator, HttpMethod.Post,
            $"/api/v1/admin/payment-declarations/{declarationId}/review", adminSession.CsrfToken,
            new { status = "Approved", reviewNote = "Η αναφορά επιβεβαιώθηκε." });
        Assert.Equal(HttpStatusCode.NoContent, approved.StatusCode);
        var paidInvoice = await administrator.GetFromJsonAsync<JsonElement>($"/api/v1/invoices/{invoiceId}");
        Assert.Equal("Paid", paidInvoice.GetProperty("status").GetString());
        Assert.NotEqual(JsonValueKind.Null, paidInvoice.GetProperty("paidAt").ValueKind);
        var reviewed = paidInvoice.GetProperty("paymentDeclarations")[0];
        Assert.Equal("Approved", reviewed.GetProperty("status").GetString());
        Assert.False(string.IsNullOrWhiteSpace(reviewed.GetProperty("reviewerName").GetString()));

        var replay = await SendWithCsrfAsync(administrator, HttpMethod.Post,
            $"/api/v1/admin/payment-declarations/{declarationId}/review", adminSession.CsrfToken,
            new { status = "Rejected", reviewNote = "Καθυστερημένη αλλαγή." });
        Assert.Equal(HttpStatusCode.Conflict, replay.StatusCode);
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

    private static Task<HttpResponseMessage> SendWithCsrfAsync(HttpClient client, HttpMethod method, string path, string csrfToken, object body)
    {
        var request = new HttpRequestMessage(method, path) { Content = JsonContent.Create(body) };
        request.Headers.Add("X-CSRF-TOKEN", csrfToken);
        return client.SendAsync(request);
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
