using System;
using Microsoft.EntityFrameworkCore.Migrations;

#nullable disable

namespace KubikPortal.Api.Data.Migrations
{
    /// <inheritdoc />
    public partial class InitialDemoWorkspace : Migration
    {
        /// <inheritdoc />
        protected override void Up(MigrationBuilder migrationBuilder)
        {
            migrationBuilder.EnsureSchema(
                name: "portal");

            migrationBuilder.CreateTable(
                name: "DemoWorkspaces",
                schema: "portal",
                columns: table => new
                {
                    Id = table.Column<Guid>(type: "uuid", nullable: false),
                    VerifiedEmail = table.Column<string>(type: "character varying(320)", maxLength: 320, nullable: false),
                    SeedVersion = table.Column<string>(type: "character varying(32)", maxLength: 32, nullable: false),
                    CreatedAt = table.Column<DateTimeOffset>(type: "timestamp with time zone", nullable: false),
                    LastSeenAt = table.Column<DateTimeOffset>(type: "timestamp with time zone", nullable: false),
                    ExpiresAt = table.Column<DateTimeOffset>(type: "timestamp with time zone", nullable: false)
                },
                constraints: table =>
                {
                    table.PrimaryKey("PK_DemoWorkspaces", x => x.Id);
                });

            migrationBuilder.CreateTable(
                name: "OtpChallenges",
                schema: "portal",
                columns: table => new
                {
                    Id = table.Column<Guid>(type: "uuid", nullable: false),
                    Email = table.Column<string>(type: "character varying(320)", maxLength: 320, nullable: false),
                    RequestedRole = table.Column<string>(type: "character varying(32)", maxLength: 32, nullable: false),
                    CodeHash = table.Column<string>(type: "character varying(64)", maxLength: 64, nullable: false),
                    CreatedAt = table.Column<DateTimeOffset>(type: "timestamp with time zone", nullable: false),
                    ExpiresAt = table.Column<DateTimeOffset>(type: "timestamp with time zone", nullable: false),
                    ConsumedAt = table.Column<DateTimeOffset>(type: "timestamp with time zone", nullable: true),
                    FailedAttempts = table.Column<int>(type: "integer", nullable: false)
                },
                constraints: table =>
                {
                    table.PrimaryKey("PK_OtpChallenges", x => x.Id);
                });

            migrationBuilder.CreateTable(
                name: "DemoPersonas",
                schema: "portal",
                columns: table => new
                {
                    Id = table.Column<Guid>(type: "uuid", nullable: false),
                    Role = table.Column<string>(type: "character varying(32)", maxLength: 32, nullable: false),
                    FirstName = table.Column<string>(type: "character varying(100)", maxLength: 100, nullable: false),
                    LastName = table.Column<string>(type: "character varying(100)", maxLength: 100, nullable: false),
                    DisplayEmail = table.Column<string>(type: "character varying(320)", maxLength: 320, nullable: false),
                    Status = table.Column<string>(type: "character varying(32)", maxLength: 32, nullable: false),
                    WorkspaceId = table.Column<Guid>(type: "uuid", nullable: false)
                },
                constraints: table =>
                {
                    table.PrimaryKey("PK_DemoPersonas", x => x.Id);
                    table.ForeignKey(
                        name: "FK_DemoPersonas_DemoWorkspaces_WorkspaceId",
                        column: x => x.WorkspaceId,
                        principalSchema: "portal",
                        principalTable: "DemoWorkspaces",
                        principalColumn: "Id",
                        onDelete: ReferentialAction.Cascade);
                });

            migrationBuilder.CreateTable(
                name: "ServiceCategories",
                schema: "portal",
                columns: table => new
                {
                    Id = table.Column<Guid>(type: "uuid", nullable: false),
                    Name = table.Column<string>(type: "character varying(100)", maxLength: 100, nullable: false),
                    Color = table.Column<string>(type: "character varying(20)", maxLength: 20, nullable: false),
                    DisplayOrder = table.Column<int>(type: "integer", nullable: false),
                    IsActive = table.Column<bool>(type: "boolean", nullable: false),
                    WorkspaceId = table.Column<Guid>(type: "uuid", nullable: false)
                },
                constraints: table =>
                {
                    table.PrimaryKey("PK_ServiceCategories", x => x.Id);
                    table.ForeignKey(
                        name: "FK_ServiceCategories_DemoWorkspaces_WorkspaceId",
                        column: x => x.WorkspaceId,
                        principalSchema: "portal",
                        principalTable: "DemoWorkspaces",
                        principalColumn: "Id",
                        onDelete: ReferentialAction.Cascade);
                });

            migrationBuilder.CreateTable(
                name: "DemoSessions",
                schema: "portal",
                columns: table => new
                {
                    Id = table.Column<Guid>(type: "uuid", nullable: false),
                    WorkspaceId = table.Column<Guid>(type: "uuid", nullable: false),
                    PersonaId = table.Column<Guid>(type: "uuid", nullable: false),
                    CreatedAt = table.Column<DateTimeOffset>(type: "timestamp with time zone", nullable: false),
                    LastSeenAt = table.Column<DateTimeOffset>(type: "timestamp with time zone", nullable: false),
                    ExpiresAt = table.Column<DateTimeOffset>(type: "timestamp with time zone", nullable: false),
                    RevokedAt = table.Column<DateTimeOffset>(type: "timestamp with time zone", nullable: true)
                },
                constraints: table =>
                {
                    table.PrimaryKey("PK_DemoSessions", x => x.Id);
                    table.ForeignKey(
                        name: "FK_DemoSessions_DemoPersonas_PersonaId",
                        column: x => x.PersonaId,
                        principalSchema: "portal",
                        principalTable: "DemoPersonas",
                        principalColumn: "Id",
                        onDelete: ReferentialAction.Cascade);
                    table.ForeignKey(
                        name: "FK_DemoSessions_DemoWorkspaces_WorkspaceId",
                        column: x => x.WorkspaceId,
                        principalSchema: "portal",
                        principalTable: "DemoWorkspaces",
                        principalColumn: "Id",
                        onDelete: ReferentialAction.Cascade);
                });

            migrationBuilder.CreateTable(
                name: "ServicePackages",
                schema: "portal",
                columns: table => new
                {
                    Id = table.Column<Guid>(type: "uuid", nullable: false),
                    CategoryId = table.Column<Guid>(type: "uuid", nullable: false),
                    Name = table.Column<string>(type: "character varying(120)", maxLength: 120, nullable: false),
                    Description = table.Column<string>(type: "character varying(1000)", maxLength: 1000, nullable: false),
                    MonthlyPrice = table.Column<decimal>(type: "numeric(12,2)", precision: 12, scale: 2, nullable: false),
                    Currency = table.Column<string>(type: "character varying(3)", maxLength: 3, nullable: false),
                    IsActive = table.Column<bool>(type: "boolean", nullable: false),
                    WorkspaceId = table.Column<Guid>(type: "uuid", nullable: false)
                },
                constraints: table =>
                {
                    table.PrimaryKey("PK_ServicePackages", x => x.Id);
                    table.ForeignKey(
                        name: "FK_ServicePackages_DemoWorkspaces_WorkspaceId",
                        column: x => x.WorkspaceId,
                        principalSchema: "portal",
                        principalTable: "DemoWorkspaces",
                        principalColumn: "Id",
                        onDelete: ReferentialAction.Cascade);
                    table.ForeignKey(
                        name: "FK_ServicePackages_ServiceCategories_CategoryId",
                        column: x => x.CategoryId,
                        principalSchema: "portal",
                        principalTable: "ServiceCategories",
                        principalColumn: "Id",
                        onDelete: ReferentialAction.Restrict);
                });

            migrationBuilder.CreateTable(
                name: "ManagedAssets",
                schema: "portal",
                columns: table => new
                {
                    Id = table.Column<Guid>(type: "uuid", nullable: false),
                    OwnerPersonaId = table.Column<Guid>(type: "uuid", nullable: false),
                    ServicePackageId = table.Column<Guid>(type: "uuid", nullable: true),
                    Name = table.Column<string>(type: "character varying(160)", maxLength: 160, nullable: false),
                    AssetType = table.Column<string>(type: "character varying(32)", maxLength: 32, nullable: false),
                    Status = table.Column<string>(type: "character varying(32)", maxLength: 32, nullable: false),
                    Url = table.Column<string>(type: "character varying(500)", maxLength: 500, nullable: true),
                    CreatedAt = table.Column<DateTimeOffset>(type: "timestamp with time zone", nullable: false),
                    WorkspaceId = table.Column<Guid>(type: "uuid", nullable: false)
                },
                constraints: table =>
                {
                    table.PrimaryKey("PK_ManagedAssets", x => x.Id);
                    table.ForeignKey(
                        name: "FK_ManagedAssets_DemoPersonas_OwnerPersonaId",
                        column: x => x.OwnerPersonaId,
                        principalSchema: "portal",
                        principalTable: "DemoPersonas",
                        principalColumn: "Id",
                        onDelete: ReferentialAction.Restrict);
                    table.ForeignKey(
                        name: "FK_ManagedAssets_DemoWorkspaces_WorkspaceId",
                        column: x => x.WorkspaceId,
                        principalSchema: "portal",
                        principalTable: "DemoWorkspaces",
                        principalColumn: "Id",
                        onDelete: ReferentialAction.Cascade);
                    table.ForeignKey(
                        name: "FK_ManagedAssets_ServicePackages_ServicePackageId",
                        column: x => x.ServicePackageId,
                        principalSchema: "portal",
                        principalTable: "ServicePackages",
                        principalColumn: "Id",
                        onDelete: ReferentialAction.SetNull);
                });

            migrationBuilder.CreateTable(
                name: "ServicePackageFeatures",
                schema: "portal",
                columns: table => new
                {
                    Id = table.Column<Guid>(type: "uuid", nullable: false),
                    ServicePackageId = table.Column<Guid>(type: "uuid", nullable: false),
                    Position = table.Column<int>(type: "integer", nullable: false),
                    Text = table.Column<string>(type: "character varying(240)", maxLength: 240, nullable: false),
                    WorkspaceId = table.Column<Guid>(type: "uuid", nullable: false)
                },
                constraints: table =>
                {
                    table.PrimaryKey("PK_ServicePackageFeatures", x => x.Id);
                    table.ForeignKey(
                        name: "FK_ServicePackageFeatures_DemoWorkspaces_WorkspaceId",
                        column: x => x.WorkspaceId,
                        principalSchema: "portal",
                        principalTable: "DemoWorkspaces",
                        principalColumn: "Id",
                        onDelete: ReferentialAction.Cascade);
                    table.ForeignKey(
                        name: "FK_ServicePackageFeatures_ServicePackages_ServicePackageId",
                        column: x => x.ServicePackageId,
                        principalSchema: "portal",
                        principalTable: "ServicePackages",
                        principalColumn: "Id",
                        onDelete: ReferentialAction.Cascade);
                });

            migrationBuilder.CreateIndex(
                name: "IX_DemoPersonas_WorkspaceId",
                schema: "portal",
                table: "DemoPersonas",
                column: "WorkspaceId");

            migrationBuilder.CreateIndex(
                name: "IX_DemoSessions_ExpiresAt",
                schema: "portal",
                table: "DemoSessions",
                column: "ExpiresAt");

            migrationBuilder.CreateIndex(
                name: "IX_DemoSessions_PersonaId",
                schema: "portal",
                table: "DemoSessions",
                column: "PersonaId");

            migrationBuilder.CreateIndex(
                name: "IX_DemoSessions_WorkspaceId",
                schema: "portal",
                table: "DemoSessions",
                column: "WorkspaceId");

            migrationBuilder.CreateIndex(
                name: "IX_DemoWorkspaces_ExpiresAt",
                schema: "portal",
                table: "DemoWorkspaces",
                column: "ExpiresAt");

            migrationBuilder.CreateIndex(
                name: "IX_ManagedAssets_OwnerPersonaId",
                schema: "portal",
                table: "ManagedAssets",
                column: "OwnerPersonaId");

            migrationBuilder.CreateIndex(
                name: "IX_ManagedAssets_ServicePackageId",
                schema: "portal",
                table: "ManagedAssets",
                column: "ServicePackageId");

            migrationBuilder.CreateIndex(
                name: "IX_ManagedAssets_WorkspaceId",
                schema: "portal",
                table: "ManagedAssets",
                column: "WorkspaceId");

            migrationBuilder.CreateIndex(
                name: "IX_OtpChallenges_Email_CreatedAt",
                schema: "portal",
                table: "OtpChallenges",
                columns: new[] { "Email", "CreatedAt" });

            migrationBuilder.CreateIndex(
                name: "IX_ServiceCategories_WorkspaceId",
                schema: "portal",
                table: "ServiceCategories",
                column: "WorkspaceId");

            migrationBuilder.CreateIndex(
                name: "IX_ServicePackageFeatures_ServicePackageId",
                schema: "portal",
                table: "ServicePackageFeatures",
                column: "ServicePackageId");

            migrationBuilder.CreateIndex(
                name: "IX_ServicePackageFeatures_WorkspaceId",
                schema: "portal",
                table: "ServicePackageFeatures",
                column: "WorkspaceId");

            migrationBuilder.CreateIndex(
                name: "IX_ServicePackages_CategoryId",
                schema: "portal",
                table: "ServicePackages",
                column: "CategoryId");

            migrationBuilder.CreateIndex(
                name: "IX_ServicePackages_WorkspaceId",
                schema: "portal",
                table: "ServicePackages",
                column: "WorkspaceId");
        }

        /// <inheritdoc />
        protected override void Down(MigrationBuilder migrationBuilder)
        {
            migrationBuilder.DropTable(
                name: "DemoSessions",
                schema: "portal");

            migrationBuilder.DropTable(
                name: "ManagedAssets",
                schema: "portal");

            migrationBuilder.DropTable(
                name: "OtpChallenges",
                schema: "portal");

            migrationBuilder.DropTable(
                name: "ServicePackageFeatures",
                schema: "portal");

            migrationBuilder.DropTable(
                name: "DemoPersonas",
                schema: "portal");

            migrationBuilder.DropTable(
                name: "ServicePackages",
                schema: "portal");

            migrationBuilder.DropTable(
                name: "ServiceCategories",
                schema: "portal");

            migrationBuilder.DropTable(
                name: "DemoWorkspaces",
                schema: "portal");
        }
    }
}
