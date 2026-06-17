using Microsoft.EntityFrameworkCore.Migrations;

#nullable disable

namespace VinhHy.NarrationAPI.Infrastructure.Migrations
{
    /// <inheritdoc />
    public partial class AllowServiceLevelQr : Migration
    {
        /// <inheritdoc />
        protected override void Up(MigrationBuilder migrationBuilder)
        {
            migrationBuilder.DropCheckConstraint(
                name: "CK_QRLocations_Target",
                table: "QRLocations");

            migrationBuilder.AddCheckConstraint(
                name: "CK_QRLocations_Target",
                table: "QRLocations",
                sql: "NOT ([PoiId] IS NOT NULL AND [TourId] IS NOT NULL)");
        }

        /// <inheritdoc />
        protected override void Down(MigrationBuilder migrationBuilder)
        {
            migrationBuilder.DropCheckConstraint(
                name: "CK_QRLocations_Target",
                table: "QRLocations");

            migrationBuilder.AddCheckConstraint(
                name: "CK_QRLocations_Target",
                table: "QRLocations",
                sql: "([PoiId] IS NOT NULL AND [TourId] IS NULL) OR ([PoiId] IS NULL AND [TourId] IS NOT NULL)");
        }
    }
}
