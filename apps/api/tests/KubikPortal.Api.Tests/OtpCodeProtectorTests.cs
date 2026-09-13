using KubikPortal.Api.Infrastructure;
using Microsoft.Extensions.Configuration;

namespace KubikPortal.Api.Tests;

public sealed class OtpCodeProtectorTests
{
    [Fact]
    public void VerificationIsBoundToChallengeAndCode()
    {
        var configuration = new ConfigurationBuilder().AddInMemoryCollection(new Dictionary<string, string?>
        {
            ["Demo:OtpHashSecret"] = "a-test-only-key-with-at-least-32-characters"
        }).Build();
        var protector = new OtpCodeProtector(configuration);
        var challengeId = Guid.NewGuid();
        var hash = protector.Hash(challengeId, "123456");

        Assert.True(protector.Verify(challengeId, "123456", hash));
        Assert.False(protector.Verify(challengeId, "654321", hash));
        Assert.False(protector.Verify(Guid.NewGuid(), "123456", hash));
    }
}
