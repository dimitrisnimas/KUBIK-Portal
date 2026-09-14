using System;
using Microsoft.EntityFrameworkCore.Migrations;

#nullable disable

namespace KubikPortal.Api.Data.Migrations
{
    /// <inheritdoc />
    public partial class Billing : Migration
    {
        /// <inheritdoc />
        protected override void Up(MigrationBuilder migrationBuilder)
        {
            migrationBuilder.CreateTable(
                name: "Invoices",
                schema: "portal",
                columns: table => new
                {
                    Id = table.Column<Guid>(type: "uuid", nullable: false),
                    ClientPersonaId = table.Column<Guid>(type: "uuid", nullable: false),
                    Number = table.Column<string>(type: "character varying(40)", maxLength: 40, nullable: false),
                    IssueDate = table.Column<DateOnly>(type: "date", nullable: false),
                    DueDate = table.Column<DateOnly>(type: "date", nullable: false),
                    Status = table.Column<string>(type: "character varying(32)", maxLength: 32, nullable: false),
                    PaidAt = table.Column<DateTimeOffset>(type: "timestamp with time zone", nullable: true),
                    Subtotal = table.Column<decimal>(type: "numeric(14,2)", precision: 14, scale: 2, nullable: false),
                    VatRate = table.Column<decimal>(type: "numeric(5,2)", precision: 5, scale: 2, nullable: false),
                    VatAmount = table.Column<decimal>(type: "numeric(14,2)", precision: 14, scale: 2, nullable: false),
                    Total = table.Column<decimal>(type: "numeric(14,2)", precision: 14, scale: 2, nullable: false),
                    Currency = table.Column<string>(type: "character varying(3)", maxLength: 3, nullable: false),
                    Notes = table.Column<string>(type: "character varying(1000)", maxLength: 1000, nullable: true),
                    CreatedAt = table.Column<DateTimeOffset>(type: "timestamp with time zone", nullable: false),
                    WorkspaceId = table.Column<Guid>(type: "uuid", nullable: false)
                },
                constraints: table =>
                {
                    table.PrimaryKey("PK_Invoices", x => x.Id);
                    table.ForeignKey(
                        name: "FK_Invoices_DemoPersonas_ClientPersonaId",
                        column: x => x.ClientPersonaId,
                        principalSchema: "portal",
                        principalTable: "DemoPersonas",
                        principalColumn: "Id",
                        onDelete: ReferentialAction.Restrict);
                    table.ForeignKey(
                        name: "FK_Invoices_DemoWorkspaces_WorkspaceId",
                        column: x => x.WorkspaceId,
                        principalSchema: "portal",
                        principalTable: "DemoWorkspaces",
                        principalColumn: "Id",
                        onDelete: ReferentialAction.Cascade);
                });

            migrationBuilder.CreateTable(
                name: "InvoiceLines",
                schema: "portal",
                columns: table => new
                {
                    Id = table.Column<Guid>(type: "uuid", nullable: false),
                    InvoiceId = table.Column<Guid>(type: "uuid", nullable: false),
                    Position = table.Column<int>(type: "integer", nullable: false),
                    Description = table.Column<string>(type: "character varying(100)", maxLength: 100, nullable: false),
                    Quantity = table.Column<decimal>(type: "numeric(10,2)", precision: 10, scale: 2, nullable: false),
                    UnitPrice = table.Column<decimal>(type: "numeric(14,2)", precision: 14, scale: 2, nullable: false),
                    LineTotal = table.Column<decimal>(type: "numeric(14,2)", precision: 14, scale: 2, nullable: false),
                    WorkspaceId = table.Column<Guid>(type: "uuid", nullable: false)
                },
                constraints: table =>
                {
                    table.PrimaryKey("PK_InvoiceLines", x => x.Id);
                    table.ForeignKey(
                        name: "FK_InvoiceLines_DemoWorkspaces_WorkspaceId",
                        column: x => x.WorkspaceId,
                        principalSchema: "portal",
                        principalTable: "DemoWorkspaces",
                        principalColumn: "Id",
                        onDelete: ReferentialAction.Cascade);
                    table.ForeignKey(
                        name: "FK_InvoiceLines_Invoices_InvoiceId",
                        column: x => x.InvoiceId,
                        principalSchema: "portal",
                        principalTable: "Invoices",
                        principalColumn: "Id",
                        onDelete: ReferentialAction.Cascade);
                });

            migrationBuilder.CreateTable(
                name: "PaymentDeclarations",
                schema: "portal",
                columns: table => new
                {
                    Id = table.Column<Guid>(type: "uuid", nullable: false),
                    InvoiceId = table.Column<Guid>(type: "uuid", nullable: false),
                    SubmittedReference = table.Column<string>(type: "character varying(500)", maxLength: 500, nullable: false),
                    SubmittedNote = table.Column<string>(type: "character varying(1000)", maxLength: 1000, nullable: true),
                    SubmittedAt = table.Column<DateTimeOffset>(type: "timestamp with time zone", nullable: false),
                    Status = table.Column<string>(type: "character varying(32)", maxLength: 32, nullable: false),
                    ReviewedAt = table.Column<DateTimeOffset>(type: "timestamp with time zone", nullable: true),
                    ReviewerPersonaId = table.Column<Guid>(type: "uuid", nullable: true),
                    ReviewNote = table.Column<string>(type: "character varying(1000)", maxLength: 1000, nullable: true),
                    WorkspaceId = table.Column<Guid>(type: "uuid", nullable: false)
                },
                constraints: table =>
                {
                    table.PrimaryKey("PK_PaymentDeclarations", x => x.Id);
                    table.ForeignKey(
                        name: "FK_PaymentDeclarations_DemoPersonas_ReviewerPersonaId",
                        column: x => x.ReviewerPersonaId,
                        principalSchema: "portal",
                        principalTable: "DemoPersonas",
                        principalColumn: "Id",
                        onDelete: ReferentialAction.Restrict);
                    table.ForeignKey(
                        name: "FK_PaymentDeclarations_DemoWorkspaces_WorkspaceId",
                        column: x => x.WorkspaceId,
                        principalSchema: "portal",
                        principalTable: "DemoWorkspaces",
                        principalColumn: "Id",
                        onDelete: ReferentialAction.Cascade);
                    table.ForeignKey(
                        name: "FK_PaymentDeclarations_Invoices_InvoiceId",
                        column: x => x.InvoiceId,
                        principalSchema: "portal",
                        principalTable: "Invoices",
                        principalColumn: "Id",
                        onDelete: ReferentialAction.Cascade);
                });

            migrationBuilder.CreateIndex(
                name: "IX_InvoiceLines_InvoiceId",
                schema: "portal",
                table: "InvoiceLines",
                column: "InvoiceId");

            migrationBuilder.CreateIndex(
                name: "IX_InvoiceLines_WorkspaceId",
                schema: "portal",
                table: "InvoiceLines",
                column: "WorkspaceId");

            migrationBuilder.CreateIndex(
                name: "IX_InvoiceLines_WorkspaceId_InvoiceId_Position",
                schema: "portal",
                table: "InvoiceLines",
                columns: new[] { "WorkspaceId", "InvoiceId", "Position" },
                unique: true);

            migrationBuilder.CreateIndex(
                name: "IX_Invoices_ClientPersonaId",
                schema: "portal",
                table: "Invoices",
                column: "ClientPersonaId");

            migrationBuilder.CreateIndex(
                name: "IX_Invoices_WorkspaceId",
                schema: "portal",
                table: "Invoices",
                column: "WorkspaceId");

            migrationBuilder.CreateIndex(
                name: "IX_Invoices_WorkspaceId_DueDate",
                schema: "portal",
                table: "Invoices",
                columns: new[] { "WorkspaceId", "DueDate" });

            migrationBuilder.CreateIndex(
                name: "IX_Invoices_WorkspaceId_Number",
                schema: "portal",
                table: "Invoices",
                columns: new[] { "WorkspaceId", "Number" },
                unique: true);

            migrationBuilder.CreateIndex(
                name: "IX_PaymentDeclarations_InvoiceId",
                schema: "portal",
                table: "PaymentDeclarations",
                column: "InvoiceId",
                unique: true,
                filter: "\"Status\" = 'PendingReview'");

            migrationBuilder.CreateIndex(
                name: "IX_PaymentDeclarations_ReviewerPersonaId",
                schema: "portal",
                table: "PaymentDeclarations",
                column: "ReviewerPersonaId");

            migrationBuilder.CreateIndex(
                name: "IX_PaymentDeclarations_WorkspaceId",
                schema: "portal",
                table: "PaymentDeclarations",
                column: "WorkspaceId");

            migrationBuilder.CreateIndex(
                name: "IX_PaymentDeclarations_WorkspaceId_Status_SubmittedAt",
                schema: "portal",
                table: "PaymentDeclarations",
                columns: new[] { "WorkspaceId", "Status", "SubmittedAt" });
        }

        /// <inheritdoc />
        protected override void Down(MigrationBuilder migrationBuilder)
        {
            migrationBuilder.DropTable(
                name: "InvoiceLines",
                schema: "portal");

            migrationBuilder.DropTable(
                name: "PaymentDeclarations",
                schema: "portal");

            migrationBuilder.DropTable(
                name: "Invoices",
                schema: "portal");
        }
    }
}
