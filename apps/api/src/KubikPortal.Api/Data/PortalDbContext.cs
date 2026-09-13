using KubikPortal.Api.Domain;
using Microsoft.EntityFrameworkCore;

namespace KubikPortal.Api.Data;

public sealed class PortalDbContext(DbContextOptions<PortalDbContext> options, IWorkspaceContext workspaceContext)
    : DbContext(options)
{
    public DbSet<DemoWorkspace> DemoWorkspaces => Set<DemoWorkspace>();
    public DbSet<DemoPersona> DemoPersonas => Set<DemoPersona>();
    public DbSet<ServiceCategory> ServiceCategories => Set<ServiceCategory>();
    public DbSet<ServicePackage> ServicePackages => Set<ServicePackage>();
    public DbSet<ServicePackageFeature> ServicePackageFeatures => Set<ServicePackageFeature>();
    public DbSet<ManagedAsset> ManagedAssets => Set<ManagedAsset>();
    public DbSet<OtpChallenge> OtpChallenges => Set<OtpChallenge>();
    public DbSet<DemoSession> DemoSessions => Set<DemoSession>();

    protected override void OnModelCreating(ModelBuilder modelBuilder)
    {
        modelBuilder.HasDefaultSchema("portal");
        modelBuilder.Entity<DemoWorkspace>(entity =>
        {
            entity.HasKey(x => x.Id);
            entity.Property(x => x.VerifiedEmail).HasMaxLength(320);
            entity.Property(x => x.SeedVersion).HasMaxLength(32);
            entity.HasIndex(x => x.ExpiresAt);
        });
        modelBuilder.Entity<OtpChallenge>(entity =>
        {
            entity.HasKey(x => x.Id);
            entity.Property(x => x.Email).HasMaxLength(320);
            entity.Property(x => x.CodeHash).HasMaxLength(64);
            entity.Property(x => x.RequestedRole).HasConversion<string>().HasMaxLength(32);
            entity.HasIndex(x => new { x.Email, x.CreatedAt });
        });
        modelBuilder.Entity<DemoSession>(entity =>
        {
            entity.HasKey(x => x.Id);
            entity.HasIndex(x => x.ExpiresAt);
            entity.HasQueryFilter(x => workspaceContext.WorkspaceId != null && x.WorkspaceId == workspaceContext.WorkspaceId);
            entity.HasOne(x => x.Workspace).WithMany().HasForeignKey(x => x.WorkspaceId).OnDelete(DeleteBehavior.Cascade);
            entity.HasOne(x => x.Persona).WithMany().HasForeignKey(x => x.PersonaId).OnDelete(DeleteBehavior.Cascade);
        });
        ConfigureWorkspaceEntity<DemoPersona>(modelBuilder);
        ConfigureWorkspaceEntity<ServiceCategory>(modelBuilder);
        ConfigureWorkspaceEntity<ServicePackage>(modelBuilder);
        ConfigureWorkspaceEntity<ServicePackageFeature>(modelBuilder);
        ConfigureWorkspaceEntity<ManagedAsset>(modelBuilder);

        modelBuilder.Entity<DemoPersona>(entity =>
        {
            entity.Property(x => x.Role).HasConversion<string>().HasMaxLength(32);
            entity.Property(x => x.Status).HasConversion<string>().HasMaxLength(32);
            entity.Property(x => x.FirstName).HasMaxLength(100);
            entity.Property(x => x.LastName).HasMaxLength(100);
            entity.Property(x => x.DisplayEmail).HasMaxLength(320);
        });
        modelBuilder.Entity<ServiceCategory>(entity =>
        {
            entity.Property(x => x.Name).HasMaxLength(100);
            entity.Property(x => x.Color).HasMaxLength(20);
        });
        modelBuilder.Entity<ServicePackage>(entity =>
        {
            entity.Property(x => x.Name).HasMaxLength(120);
            entity.Property(x => x.Description).HasMaxLength(1000);
            entity.Property(x => x.MonthlyPrice).HasPrecision(12, 2);
            entity.Property(x => x.Currency).HasMaxLength(3);
            entity.HasOne(x => x.Category).WithMany().HasForeignKey(x => x.CategoryId).OnDelete(DeleteBehavior.Restrict);
        });
        modelBuilder.Entity<ServicePackageFeature>(entity =>
        {
            entity.Property(x => x.Text).HasMaxLength(240);
            entity.HasOne(x => x.ServicePackage).WithMany(x => x.Features).HasForeignKey(x => x.ServicePackageId).OnDelete(DeleteBehavior.Cascade);
        });
        modelBuilder.Entity<ManagedAsset>(entity =>
        {
            entity.Property(x => x.Name).HasMaxLength(160);
            entity.Property(x => x.Url).HasMaxLength(500);
            entity.Property(x => x.AssetType).HasConversion<string>().HasMaxLength(32);
            entity.Property(x => x.Status).HasConversion<string>().HasMaxLength(32);
            entity.HasOne(x => x.OwnerPersona).WithMany().HasForeignKey(x => x.OwnerPersonaId).OnDelete(DeleteBehavior.Restrict);
            entity.HasOne(x => x.ServicePackage).WithMany().HasForeignKey(x => x.ServicePackageId).OnDelete(DeleteBehavior.SetNull);
        });
    }

    private void ConfigureWorkspaceEntity<TEntity>(ModelBuilder modelBuilder) where TEntity : WorkspaceEntity
    {
        modelBuilder.Entity<TEntity>().HasKey(x => x.Id);
        modelBuilder.Entity<TEntity>().HasIndex(x => x.WorkspaceId);
        modelBuilder.Entity<TEntity>().HasOne(x => x.Workspace).WithMany().HasForeignKey(x => x.WorkspaceId).OnDelete(DeleteBehavior.Cascade);
        modelBuilder.Entity<TEntity>().HasQueryFilter(x => workspaceContext.WorkspaceId != null && x.WorkspaceId == workspaceContext.WorkspaceId);
    }
}
