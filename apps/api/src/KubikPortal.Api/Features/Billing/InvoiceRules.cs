namespace KubikPortal.Api.Features.Billing;

public static class InvoiceRules
{
    public const decimal VatRate = 24m;

    public static InvoiceTotals Calculate(IEnumerable<(decimal Quantity, decimal UnitPrice)> lines)
    {
        var subtotal = lines.Sum(line => decimal.Round(line.Quantity * line.UnitPrice, 2, MidpointRounding.AwayFromZero));
        var vatAmount = decimal.Round(subtotal * VatRate / 100m, 2, MidpointRounding.AwayFromZero);
        return new InvoiceTotals(subtotal, VatRate, vatAmount, subtotal + vatAmount);
    }
}

public sealed record InvoiceTotals(decimal Subtotal, decimal VatRate, decimal VatAmount, decimal Total);
