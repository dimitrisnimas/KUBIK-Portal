using Microsoft.EntityFrameworkCore.Migrations;

#nullable disable

namespace KubikPortal.Api.Data.Migrations
{
    /// <inheritdoc />
    public partial class CatalogConstraints : Migration
    {
        /// <inheritdoc />
        protected override void Up(MigrationBuilder migrationBuilder)
        {
            migrationBuilder.CreateIndex(
                name: "IX_ServicePackages_WorkspaceId_Name",
                schema: "portal",
                table: "ServicePackages",
                columns: new[] { "WorkspaceId", "Name" },
                unique: true);

            migrationBuilder.CreateIndex(
                name: "IX_ServiceCategories_WorkspaceId_Name",
                schema: "portal",
                table: "ServiceCategories",
                columns: new[] { "WorkspaceId", "Name" },
                unique: true);
        }

        /// <inheritdoc />
        protected override void Down(MigrationBuilder migrationBuilder)
        {
            migrationBuilder.DropIndex(
                name: "IX_ServicePackages_WorkspaceId_Name",
                schema: "portal",
                table: "ServicePackages");

            migrationBuilder.DropIndex(
                name: "IX_ServiceCategories_WorkspaceId_Name",
                schema: "portal",
                table: "ServiceCategories");
        }
    }
}
