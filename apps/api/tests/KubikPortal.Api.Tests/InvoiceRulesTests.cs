using KubikPortal.Api.Domain;
using KubikPortal.Api.Features.Billing;

namespace KubikPortal.Api.Tests;

public sealed class InvoiceRulesTests
{
    [Fact]
    public void CalculateRoundsEachLineAndAppliesFixedGreekVat()
    {
        var totals = InvoiceRules.Calculate([(3m, 0.335m), (1m, 99.995m)]);

        Assert.Equal(101.01m, totals.Subtotal);
        Assert.Equal(24m, totals.VatRate);
        Assert.Equal(24.24m, totals.VatAmount);
        Assert.Equal(125.25m, totals.Total);
    }

    [Fact]
    public void PdfIsGeneratedFromStructuredInvoiceDataWithEmbeddedGreekFont()
    {
        var workspaceId = Guid.Parse("aaaaaaaa-aaaa-aaaa-aaaa-aaaaaaaaaaaa");
        var persona = new DemoPersona
        {
            Id = Guid.Parse("bbbbbbbb-bbbb-bbbb-bbbb-bbbbbbbbbbbb"), WorkspaceId = workspaceId,
            Role = DemoRole.Client, FirstName = "Μαρία", LastName = "Παπαδοπούλου",
            DisplayEmail = "maria@example.gr", Status = PersonaStatus.Active
        };
        var invoice = new Invoice
        {
            Id = Guid.Parse("cccccccc-cccc-cccc-cccc-cccccccccccc"), WorkspaceId = workspaceId,
            ClientPersonaId = persona.Id, ClientPersona = persona, Number = "KINV-2026-TEST",
            IssueDate = new DateOnly(2026, 9, 14), DueDate = new DateOnly(2026, 9, 30),
            Status = InvoiceStatus.Unpaid, Subtotal = 100m, VatRate = 24m, VatAmount = 24m,
            Total = 124m, Currency = "EUR", Notes = "Δοκιμαστική ελληνική σημείωση.",
            CreatedAt = new DateTimeOffset(2026, 9, 14, 10, 30, 0, TimeSpan.Zero),
            Lines =
            [
                new InvoiceLine
                {
                    Id = Guid.Parse("dddddddd-dddd-dddd-dddd-dddddddddddd"), WorkspaceId = workspaceId,
                    Position = 1, Description = "Υπηρεσίες υποστήριξης", Quantity = 1m,
                    UnitPrice = 100m, LineTotal = 100m
                }
            ]
        };

        var bytes = new InvoicePdfGenerator().Generate(invoice);
        Assert.True(bytes.Length > 10_000);
        Assert.Equal("%PDF-", System.Text.Encoding.ASCII.GetString(bytes, 0, 5));
    }
}
