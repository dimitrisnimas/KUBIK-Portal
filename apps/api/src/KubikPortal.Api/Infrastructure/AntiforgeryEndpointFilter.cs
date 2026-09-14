using Microsoft.AspNetCore.Antiforgery;

namespace KubikPortal.Api.Infrastructure;

public sealed class AntiforgeryEndpointFilter(IAntiforgery antiforgery) : IEndpointFilter
{
    public async ValueTask<object?> InvokeAsync(EndpointFilterInvocationContext context, EndpointFilterDelegate next)
    {
        try
        {
            await antiforgery.ValidateRequestAsync(context.HttpContext);
        }
        catch (AntiforgeryValidationException)
        {
            return Results.BadRequest(new { message = "Η επιβεβαίωση ασφαλείας έληξε. Ανανεώστε τη σελίδα." });
        }
        return await next(context);
    }
}
