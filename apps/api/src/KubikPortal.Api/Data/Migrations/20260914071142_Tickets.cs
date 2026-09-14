using System;
using Microsoft.EntityFrameworkCore.Migrations;

#nullable disable

namespace KubikPortal.Api.Data.Migrations
{
    /// <inheritdoc />
    public partial class Tickets : Migration
    {
        /// <inheritdoc />
        protected override void Up(MigrationBuilder migrationBuilder)
        {
            migrationBuilder.CreateTable(
                name: "SupportTickets",
                schema: "portal",
                columns: table => new
                {
                    Id = table.Column<Guid>(type: "uuid", nullable: false),
                    OwnerPersonaId = table.Column<Guid>(type: "uuid", nullable: false),
                    ManagedAssetId = table.Column<Guid>(type: "uuid", nullable: true),
                    Number = table.Column<string>(type: "character varying(32)", maxLength: 32, nullable: false),
                    Title = table.Column<string>(type: "character varying(180)", maxLength: 180, nullable: false),
                    Kind = table.Column<string>(type: "character varying(32)", maxLength: 32, nullable: false),
                    Priority = table.Column<string>(type: "character varying(32)", maxLength: 32, nullable: false),
                    Status = table.Column<string>(type: "character varying(32)", maxLength: 32, nullable: false),
                    CreatedAt = table.Column<DateTimeOffset>(type: "timestamp with time zone", nullable: false),
                    UpdatedAt = table.Column<DateTimeOffset>(type: "timestamp with time zone", nullable: false),
                    WorkspaceId = table.Column<Guid>(type: "uuid", nullable: false)
                },
                constraints: table =>
                {
                    table.PrimaryKey("PK_SupportTickets", x => x.Id);
                    table.ForeignKey(
                        name: "FK_SupportTickets_DemoPersonas_OwnerPersonaId",
                        column: x => x.OwnerPersonaId,
                        principalSchema: "portal",
                        principalTable: "DemoPersonas",
                        principalColumn: "Id",
                        onDelete: ReferentialAction.Restrict);
                    table.ForeignKey(
                        name: "FK_SupportTickets_DemoWorkspaces_WorkspaceId",
                        column: x => x.WorkspaceId,
                        principalSchema: "portal",
                        principalTable: "DemoWorkspaces",
                        principalColumn: "Id",
                        onDelete: ReferentialAction.Cascade);
                    table.ForeignKey(
                        name: "FK_SupportTickets_ManagedAssets_ManagedAssetId",
                        column: x => x.ManagedAssetId,
                        principalSchema: "portal",
                        principalTable: "ManagedAssets",
                        principalColumn: "Id",
                        onDelete: ReferentialAction.SetNull);
                });

            migrationBuilder.CreateTable(
                name: "TicketBillingDecisions",
                schema: "portal",
                columns: table => new
                {
                    Id = table.Column<Guid>(type: "uuid", nullable: false),
                    TicketId = table.Column<Guid>(type: "uuid", nullable: false),
                    Decision = table.Column<string>(type: "character varying(32)", maxLength: 32, nullable: false),
                    Price = table.Column<decimal>(type: "numeric(12,2)", precision: 12, scale: 2, nullable: true),
                    Currency = table.Column<string>(type: "character varying(3)", maxLength: 3, nullable: false),
                    Note = table.Column<string>(type: "character varying(500)", maxLength: 500, nullable: true),
                    ReviewerPersonaId = table.Column<Guid>(type: "uuid", nullable: false),
                    DecidedAt = table.Column<DateTimeOffset>(type: "timestamp with time zone", nullable: false),
                    WorkspaceId = table.Column<Guid>(type: "uuid", nullable: false)
                },
                constraints: table =>
                {
                    table.PrimaryKey("PK_TicketBillingDecisions", x => x.Id);
                    table.ForeignKey(
                        name: "FK_TicketBillingDecisions_DemoPersonas_ReviewerPersonaId",
                        column: x => x.ReviewerPersonaId,
                        principalSchema: "portal",
                        principalTable: "DemoPersonas",
                        principalColumn: "Id",
                        onDelete: ReferentialAction.Restrict);
                    table.ForeignKey(
                        name: "FK_TicketBillingDecisions_DemoWorkspaces_WorkspaceId",
                        column: x => x.WorkspaceId,
                        principalSchema: "portal",
                        principalTable: "DemoWorkspaces",
                        principalColumn: "Id",
                        onDelete: ReferentialAction.Cascade);
                    table.ForeignKey(
                        name: "FK_TicketBillingDecisions_SupportTickets_TicketId",
                        column: x => x.TicketId,
                        principalSchema: "portal",
                        principalTable: "SupportTickets",
                        principalColumn: "Id",
                        onDelete: ReferentialAction.Cascade);
                });

            migrationBuilder.CreateTable(
                name: "TicketMessages",
                schema: "portal",
                columns: table => new
                {
                    Id = table.Column<Guid>(type: "uuid", nullable: false),
                    TicketId = table.Column<Guid>(type: "uuid", nullable: false),
                    AuthorPersonaId = table.Column<Guid>(type: "uuid", nullable: false),
                    Body = table.Column<string>(type: "character varying(4000)", maxLength: 4000, nullable: false),
                    CreatedAt = table.Column<DateTimeOffset>(type: "timestamp with time zone", nullable: false),
                    WorkspaceId = table.Column<Guid>(type: "uuid", nullable: false)
                },
                constraints: table =>
                {
                    table.PrimaryKey("PK_TicketMessages", x => x.Id);
                    table.ForeignKey(
                        name: "FK_TicketMessages_DemoPersonas_AuthorPersonaId",
                        column: x => x.AuthorPersonaId,
                        principalSchema: "portal",
                        principalTable: "DemoPersonas",
                        principalColumn: "Id",
                        onDelete: ReferentialAction.Restrict);
                    table.ForeignKey(
                        name: "FK_TicketMessages_DemoWorkspaces_WorkspaceId",
                        column: x => x.WorkspaceId,
                        principalSchema: "portal",
                        principalTable: "DemoWorkspaces",
                        principalColumn: "Id",
                        onDelete: ReferentialAction.Cascade);
                    table.ForeignKey(
                        name: "FK_TicketMessages_SupportTickets_TicketId",
                        column: x => x.TicketId,
                        principalSchema: "portal",
                        principalTable: "SupportTickets",
                        principalColumn: "Id",
                        onDelete: ReferentialAction.Cascade);
                });

            migrationBuilder.CreateIndex(
                name: "IX_SupportTickets_ManagedAssetId",
                schema: "portal",
                table: "SupportTickets",
                column: "ManagedAssetId");

            migrationBuilder.CreateIndex(
                name: "IX_SupportTickets_OwnerPersonaId",
                schema: "portal",
                table: "SupportTickets",
                column: "OwnerPersonaId");

            migrationBuilder.CreateIndex(
                name: "IX_SupportTickets_WorkspaceId",
                schema: "portal",
                table: "SupportTickets",
                column: "WorkspaceId");

            migrationBuilder.CreateIndex(
                name: "IX_SupportTickets_WorkspaceId_Number",
                schema: "portal",
                table: "SupportTickets",
                columns: new[] { "WorkspaceId", "Number" },
                unique: true);

            migrationBuilder.CreateIndex(
                name: "IX_SupportTickets_WorkspaceId_UpdatedAt",
                schema: "portal",
                table: "SupportTickets",
                columns: new[] { "WorkspaceId", "UpdatedAt" });

            migrationBuilder.CreateIndex(
                name: "IX_TicketBillingDecisions_ReviewerPersonaId",
                schema: "portal",
                table: "TicketBillingDecisions",
                column: "ReviewerPersonaId");

            migrationBuilder.CreateIndex(
                name: "IX_TicketBillingDecisions_TicketId",
                schema: "portal",
                table: "TicketBillingDecisions",
                column: "TicketId");

            migrationBuilder.CreateIndex(
                name: "IX_TicketBillingDecisions_WorkspaceId",
                schema: "portal",
                table: "TicketBillingDecisions",
                column: "WorkspaceId");

            migrationBuilder.CreateIndex(
                name: "IX_TicketBillingDecisions_WorkspaceId_TicketId_DecidedAt",
                schema: "portal",
                table: "TicketBillingDecisions",
                columns: new[] { "WorkspaceId", "TicketId", "DecidedAt" });

            migrationBuilder.CreateIndex(
                name: "IX_TicketMessages_AuthorPersonaId",
                schema: "portal",
                table: "TicketMessages",
                column: "AuthorPersonaId");

            migrationBuilder.CreateIndex(
                name: "IX_TicketMessages_TicketId",
                schema: "portal",
                table: "TicketMessages",
                column: "TicketId");

            migrationBuilder.CreateIndex(
                name: "IX_TicketMessages_WorkspaceId",
                schema: "portal",
                table: "TicketMessages",
                column: "WorkspaceId");

            migrationBuilder.CreateIndex(
                name: "IX_TicketMessages_WorkspaceId_TicketId_CreatedAt",
                schema: "portal",
                table: "TicketMessages",
                columns: new[] { "WorkspaceId", "TicketId", "CreatedAt" });
        }

        /// <inheritdoc />
        protected override void Down(MigrationBuilder migrationBuilder)
        {
            migrationBuilder.DropTable(
                name: "TicketBillingDecisions",
                schema: "portal");

            migrationBuilder.DropTable(
                name: "TicketMessages",
                schema: "portal");

            migrationBuilder.DropTable(
                name: "SupportTickets",
                schema: "portal");
        }
    }
}
