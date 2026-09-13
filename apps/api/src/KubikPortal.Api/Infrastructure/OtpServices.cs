using System.Globalization;
using System.Net;
using System.Net.Mail;
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
    IOptions<SmtpOptions> smtpOptions,
    IOptions<DemoOptions> demoOptions,
    IWebHostEnvironment environment)
{
    public async Task<string?> SendAsync(string recipient, string code, CancellationToken cancellationToken)
    {
        if (environment.IsDevelopment() && demoOptions.Value.RevealOtpInDevelopment)
        {
            return code;
        }

        var options = smtpOptions.Value;
        if (string.IsNullOrWhiteSpace(options.Host) || string.IsNullOrWhiteSpace(options.FromAddress))
        {
            throw new InvalidOperationException("Η αποστολή email δεν έχει ρυθμιστεί.");
        }

        using var message = new MailMessage
        {
            From = new MailAddress(options.FromAddress, options.FromName, Encoding.UTF8),
            Subject = "Κωδικός πρόσβασης στο KUBIK Portal Demo",
            Body = $"Ο κωδικός επαλήθευσής σας είναι {code}. Ισχύει για {demoOptions.Value.OtpLifetimeMinutes.ToString(CultureInfo.InvariantCulture)} λεπτά.",
            BodyEncoding = Encoding.UTF8,
            SubjectEncoding = Encoding.UTF8
        };
        message.To.Add(recipient);

        using var client = new SmtpClient(options.Host, options.Port)
        {
            EnableSsl = options.UseSsl,
            Credentials = string.IsNullOrWhiteSpace(options.Username)
                ? CredentialCache.DefaultNetworkCredentials
                : new NetworkCredential(options.Username, options.Password)
        };
        cancellationToken.ThrowIfCancellationRequested();
        await client.SendMailAsync(message, cancellationToken);
        return null;
    }
}
