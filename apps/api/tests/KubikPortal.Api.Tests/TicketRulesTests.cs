using KubikPortal.Api.Domain;
using KubikPortal.Api.Features.Tickets;

namespace KubikPortal.Api.Tests;

public sealed class TicketRulesTests
{
    [Fact]
    public void StatusTransitionsAreExplicit()
    {
        Assert.True(TicketRules.CanTransition(TicketStatus.New, TicketStatus.InProgress));
        Assert.False(TicketRules.CanTransition(TicketStatus.New, TicketStatus.Resolved));
        Assert.True(TicketRules.CanTransition(TicketStatus.Closed, TicketStatus.InProgress));
    }

    [Fact]
    public void ChargeableDecisionRequiresPriceAndCoveredDecisionRejectsIt()
    {
        Assert.NotNull(TicketRules.ValidateBilling(BillingDecisionKind.Chargeable, null));
        Assert.Null(TicketRules.ValidateBilling(BillingDecisionKind.Chargeable, 125m));
        Assert.NotNull(TicketRules.ValidateBilling(BillingDecisionKind.Covered, 1m));
        Assert.Null(TicketRules.ValidateBilling(BillingDecisionKind.Covered, null));
    }
}
