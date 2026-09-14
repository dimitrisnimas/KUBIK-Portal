using System.Diagnostics;
using System.Diagnostics.Metrics;
using Microsoft.AspNetCore.Routing;

namespace KubikPortal.Api.Infrastructure;

public sealed class RequestDiagnosticsMiddleware(RequestDelegate next, ILogger<RequestDiagnosticsMiddleware> logger)
{
    public const string CorrelationHeader = "X-Correlation-ID";
    private static readonly Meter Meter = new("KubikPortal.Api");
    private static readonly Counter<long> RequestCounter = Meter.CreateCounter<long>("kubik.http.server.requests");
    private static readonly Histogram<double> RequestDuration = Meter.CreateHistogram<double>("kubik.http.server.duration", "ms");

    public async Task InvokeAsync(HttpContext context)
    {
        var correlationId = ValidCorrelationId(context.Request.Headers[CorrelationHeader].FirstOrDefault())
            ?? Activity.Current?.TraceId.ToString()
            ?? Guid.NewGuid().ToString("N");
        context.TraceIdentifier = correlationId;
        context.Response.Headers[CorrelationHeader] = correlationId;

        var started = Stopwatch.GetTimestamp();
        using var scope = logger.BeginScope(new Dictionary<string, object> { ["CorrelationId"] = correlationId });
        await next(context);

        var elapsedMilliseconds = Stopwatch.GetElapsedTime(started).TotalMilliseconds;
        var route = (context.GetEndpoint() as RouteEndpoint)?.RoutePattern.RawText ?? "unmatched";
        var tags = new TagList
        {
            { "http.request.method", context.Request.Method },
            { "http.route", route },
            { "http.response.status_code", context.Response.StatusCode }
        };
        RequestCounter.Add(1, tags);
        RequestDuration.Record(elapsedMilliseconds, tags);
        logger.LogInformation("HTTP {Method} {Route} completed with {StatusCode} in {ElapsedMilliseconds:F1} ms.",
            context.Request.Method, route, context.Response.StatusCode, elapsedMilliseconds);
    }

    private static string? ValidCorrelationId(string? value)
    {
        if (string.IsNullOrWhiteSpace(value) || value.Length > 64) return null;
        return value.All(character => char.IsAsciiLetterOrDigit(character) || character is '-' or '_') ? value : null;
    }
}
