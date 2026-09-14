namespace KubikPortal.Api.Domain;

public enum DemoRole { Client, Administrator }
public enum PersonaStatus { Active, Inactive }
public enum AssetType { Website, Eshop, SocialMedia, Seo }
public enum AssetStatus { Active, Paused }
public enum TicketKind { Support, ChangeRequest, Bug, Feature }
public enum TicketPriority { Normal, High, Urgent }
public enum TicketStatus { New, InProgress, AwaitingClient, Resolved, Closed }
public enum BillingDecisionKind { Covered, Chargeable }
public enum InvoiceStatus { Unpaid, Paid }
public enum PaymentDeclarationStatus { PendingReview, Approved, Rejected }

public sealed class DemoWorkspace
{
    public Guid Id { get; set; }
    public required string VerifiedEmail { get; set; }
    public required string SeedVersion { get; set; }
    public DateTimeOffset CreatedAt { get; set; }
    public DateTimeOffset LastSeenAt { get; set; }
    public DateTimeOffset ExpiresAt { get; set; }
}

public abstract class WorkspaceEntity
{
    public Guid Id { get; set; }
    public Guid WorkspaceId { get; set; }
    public DemoWorkspace Workspace { get; set; } = null!;
}

public sealed class DemoPersona : WorkspaceEntity
{
    public DemoRole Role { get; set; }
    public required string FirstName { get; set; }
    public required string LastName { get; set; }
    public required string DisplayEmail { get; set; }
    public PersonaStatus Status { get; set; }
}

public sealed class ServiceCategory : WorkspaceEntity
{
    public required string Name { get; set; }
    public required string Color { get; set; }
    public int DisplayOrder { get; set; }
    public bool IsActive { get; set; }
}

public sealed class ServicePackage : WorkspaceEntity
{
    public Guid CategoryId { get; set; }
    public ServiceCategory Category { get; set; } = null!;
    public required string Name { get; set; }
    public required string Description { get; set; }
    public decimal MonthlyPrice { get; set; }
    public required string Currency { get; set; }
    public bool IsActive { get; set; }
    public List<ServicePackageFeature> Features { get; set; } = [];
}

public sealed class ServicePackageFeature : WorkspaceEntity
{
    public Guid ServicePackageId { get; set; }
    public ServicePackage ServicePackage { get; set; } = null!;
    public int Position { get; set; }
    public required string Text { get; set; }
}

public sealed class ManagedAsset : WorkspaceEntity
{
    public Guid OwnerPersonaId { get; set; }
    public DemoPersona OwnerPersona { get; set; } = null!;
    public Guid? ServicePackageId { get; set; }
    public ServicePackage? ServicePackage { get; set; }
    public required string Name { get; set; }
    public AssetType AssetType { get; set; }
    public AssetStatus Status { get; set; }
    public string? Url { get; set; }
    public DateTimeOffset CreatedAt { get; set; }
}

public sealed class SupportTicket : WorkspaceEntity
{
    public Guid OwnerPersonaId { get; set; }
    public DemoPersona OwnerPersona { get; set; } = null!;
    public Guid? ManagedAssetId { get; set; }
    public ManagedAsset? ManagedAsset { get; set; }
    public required string Number { get; set; }
    public required string Title { get; set; }
    public TicketKind Kind { get; set; }
    public TicketPriority Priority { get; set; }
    public TicketStatus Status { get; set; }
    public DateTimeOffset CreatedAt { get; set; }
    public DateTimeOffset UpdatedAt { get; set; }
    public List<TicketMessage> Messages { get; set; } = [];
    public List<TicketBillingDecision> BillingDecisions { get; set; } = [];
}

public sealed class TicketMessage : WorkspaceEntity
{
    public Guid TicketId { get; set; }
    public SupportTicket Ticket { get; set; } = null!;
    public Guid AuthorPersonaId { get; set; }
    public DemoPersona AuthorPersona { get; set; } = null!;
    public required string Body { get; set; }
    public DateTimeOffset CreatedAt { get; set; }
}

public sealed class TicketBillingDecision : WorkspaceEntity
{
    public Guid TicketId { get; set; }
    public SupportTicket Ticket { get; set; } = null!;
    public BillingDecisionKind Decision { get; set; }
    public decimal? Price { get; set; }
    public required string Currency { get; set; }
    public string? Note { get; set; }
    public Guid ReviewerPersonaId { get; set; }
    public DemoPersona ReviewerPersona { get; set; } = null!;
    public DateTimeOffset DecidedAt { get; set; }
}

public sealed class Invoice : WorkspaceEntity
{
    public Guid ClientPersonaId { get; set; }
    public DemoPersona ClientPersona { get; set; } = null!;
    public required string Number { get; set; }
    public DateOnly IssueDate { get; set; }
    public DateOnly DueDate { get; set; }
    public InvoiceStatus Status { get; set; }
    public DateTimeOffset? PaidAt { get; set; }
    public decimal Subtotal { get; set; }
    public decimal VatRate { get; set; }
    public decimal VatAmount { get; set; }
    public decimal Total { get; set; }
    public required string Currency { get; set; }
    public string? Notes { get; set; }
    public DateTimeOffset CreatedAt { get; set; }
    public List<InvoiceLine> Lines { get; set; } = [];
    public List<PaymentDeclaration> PaymentDeclarations { get; set; } = [];
}

public sealed class InvoiceLine : WorkspaceEntity
{
    public Guid InvoiceId { get; set; }
    public Invoice Invoice { get; set; } = null!;
    public int Position { get; set; }
    public required string Description { get; set; }
    public decimal Quantity { get; set; }
    public decimal UnitPrice { get; set; }
    public decimal LineTotal { get; set; }
}

public sealed class PaymentDeclaration : WorkspaceEntity
{
    public Guid InvoiceId { get; set; }
    public Invoice Invoice { get; set; } = null!;
    public required string SubmittedReference { get; set; }
    public string? SubmittedNote { get; set; }
    public DateTimeOffset SubmittedAt { get; set; }
    public PaymentDeclarationStatus Status { get; set; }
    public DateTimeOffset? ReviewedAt { get; set; }
    public Guid? ReviewerPersonaId { get; set; }
    public DemoPersona? ReviewerPersona { get; set; }
    public string? ReviewNote { get; set; }
}

public sealed class OtpChallenge
{
    public Guid Id { get; set; }
    public required string Email { get; set; }
    public DemoRole RequestedRole { get; set; }
    public required string CodeHash { get; set; }
    public DateTimeOffset CreatedAt { get; set; }
    public DateTimeOffset ExpiresAt { get; set; }
    public DateTimeOffset? ConsumedAt { get; set; }
    public int FailedAttempts { get; set; }
}

public sealed class DemoSession
{
    public Guid Id { get; set; }
    public Guid WorkspaceId { get; set; }
    public DemoWorkspace Workspace { get; set; } = null!;
    public Guid PersonaId { get; set; }
    public DemoPersona Persona { get; set; } = null!;
    public DateTimeOffset CreatedAt { get; set; }
    public DateTimeOffset LastSeenAt { get; set; }
    public DateTimeOffset ExpiresAt { get; set; }
    public DateTimeOffset? RevokedAt { get; set; }
}
