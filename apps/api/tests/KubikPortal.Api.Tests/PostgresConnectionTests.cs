using KubikPortal.Api.Infrastructure;
using Npgsql;

namespace KubikPortal.Api.Tests;

public sealed class PostgresConnectionTests
{
    [Fact]
    public void RenderStyleUrlIsConvertedToNpgsqlConnectionString()
    {
        var normalized = PostgresConnection.Normalize("postgresql://demo%40user:p%40ss@database.internal:5433/portal_demo");
        var parsed = new NpgsqlConnectionStringBuilder(normalized);

        Assert.Equal("demo@user", parsed.Username);
        Assert.Equal("p@ss", parsed.Password);
        Assert.Equal("database.internal", parsed.Host);
        Assert.Equal(5433, parsed.Port);
        Assert.Equal("portal_demo", parsed.Database);
        Assert.Equal(SslMode.VerifyFull, parsed.SslMode);
    }
}
