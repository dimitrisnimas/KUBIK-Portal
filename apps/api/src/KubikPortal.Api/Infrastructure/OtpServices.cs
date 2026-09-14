using System.Globalization;
using System.Net.Http.Json;
using System.Security.Cryptography;
using System.Text;
using Microsoft.Extensions.Options;

namespace KubikPortal.Api.Infrastructure;

public sealed class OtpCodeProtector(IConfiguration configuration)
{
    private readonly byte[] _key = Encoding.UTF8.GetBytes(
        configuration["Demo:OtpHashSecret"] ?? Convert.ToHexString(RandomNumberGenerator.GetBytes(32)));

    public string Hash(Guid challengeId, string code)
    {
        using var hmac = new HMACSHA256(_key);
        return Convert.ToHexString(hmac.ComputeHash(Encoding.UTF8.GetBytes($"{challengeId:N}:{code}")));
    }

    public bool Verify(Guid challengeId, string code, string expectedHash) =>
        CryptographicOperations.FixedTimeEquals(
            Convert.FromHexString(Hash(challengeId, code)),
            Convert.FromHexString(expectedHash));
}

public sealed class OtpDeliveryService(
    HttpClient httpClient,
    IOptions<BrevoOptions> brevoOptions,
    IOptions<DemoOptions> demoOptions,
    IWebHostEnvironment environment)
{
    public async Task<string?> SendAsync(string recipient, string code, CancellationToken cancellationToken)
    {
        if (environment.IsDevelopment() && demoOptions.Value.RevealOtpInDevelopment)
        {
            return code;
        }

        var options = brevoOptions.Value;
        if (string.IsNullOrWhiteSpace(options.ApiKey) || string.IsNullOrWhiteSpace(options.FromAddress))
        {
            throw new InvalidOperationException("Η αποστολή email δεν έχει ρυθμιστεί.");
        }
        using var request = new HttpRequestMessage(HttpMethod.Post, "smtp/email");
        request.Headers.Add("api-key", options.ApiKey);
        request.Content = JsonContent.Create(new BrevoEmailRequest(
            new BrevoAddress(options.FromAddress, options.FromName),
            [new BrevoAddress(recipient, null)],
            "Κωδικός πρόσβασης στο KUBIK Portal Demo",
            $"Ο κωδικός επαλήθευσής σας είναι {code}. Ισχύει για {demoOptions.Value.OtpLifetimeMinutes.ToString(CultureInfo.InvariantCulture)} λεπτά."));
        using var response = await httpClient.SendAsync(request, cancellationToken);
        response.EnsureSuccessStatusCode();
        return null;
    }

    private sealed record BrevoAddress(string Email, string? Name);
    private sealed record BrevoEmailRequest(BrevoAddress Sender, IReadOnlyList<BrevoAddress> To, string Subject, string TextContent);
}
