namespace KubikPortal.Api.Infrastructure;

public sealed class DemoOptions
{
    public const string SectionName = "Demo";
    public bool Enabled { get; init; }
    public int WorkspaceLifetimeMinutes { get; init; } = 60;
    public int OtpLifetimeMinutes { get; init; } = 10;
    public int OtpResendSeconds { get; init; } = 60;
    public bool RevealOtpInDevelopment { get; init; }
    public int CleanupIntervalMinutes { get; init; } = 5;
}

public sealed class BrevoOptions
{
    public const string SectionName = "Brevo";
    public string ApiKey { get; init; } = "";
    public string FromAddress { get; init; } = "";
    public string FromName { get; init; } = "KUBIK Portal Demo";
}
