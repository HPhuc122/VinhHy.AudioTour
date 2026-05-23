using Microsoft.EntityFrameworkCore.Migrations;

#nullable disable

namespace VinhHy.NarrationAPI.Infrastructure.Migrations
{
    /// <inheritdoc />
    public partial class AddSyncIndexes : Migration
    {
        /// <inheritdoc />
        protected override void Up(MigrationBuilder migrationBuilder)
        {
            migrationBuilder.DropIndex(
                name: "IX_AudioTracks_POIId_LanguageCode",
                table: "AudioTracks");

            migrationBuilder.CreateIndex(
                name: "IX_Tours_DeletedAt",
                table: "Tours",
                column: "DeletedAt",
                filter: "[DeletedAt] IS NOT NULL");

            migrationBuilder.CreateIndex(
                name: "IX_Tours_UpdatedAt",
                table: "Tours",
                column: "UpdatedAt");

            migrationBuilder.CreateIndex(
                name: "IX_POITranslations_UpdatedAt",
                table: "POITranslations",
                column: "UpdatedAt");

            migrationBuilder.CreateIndex(
                name: "IX_POIs_DeletedAt",
                table: "POIs",
                column: "DeletedAt",
                filter: "[DeletedAt] IS NOT NULL");

            migrationBuilder.CreateIndex(
                name: "IX_AudioTracks_POIId_LanguageCode",
                table: "AudioTracks",
                columns: new[] { "POIId", "LanguageCode" },
                unique: true,
                filter: "[IsActive] = 1 AND [DeletedAt] IS NULL");

            migrationBuilder.CreateIndex(
                name: "IX_AudioTracks_UpdatedAt",
                table: "AudioTracks",
                column: "UpdatedAt");
        }

        /// <inheritdoc />
        protected override void Down(MigrationBuilder migrationBuilder)
        {
            migrationBuilder.DropIndex(
                name: "IX_Tours_DeletedAt",
                table: "Tours");

            migrationBuilder.DropIndex(
                name: "IX_Tours_UpdatedAt",
                table: "Tours");

            migrationBuilder.DropIndex(
                name: "IX_POITranslations_UpdatedAt",
                table: "POITranslations");

            migrationBuilder.DropIndex(
                name: "IX_POIs_DeletedAt",
                table: "POIs");

            migrationBuilder.DropIndex(
                name: "IX_AudioTracks_POIId_LanguageCode",
                table: "AudioTracks");

            migrationBuilder.DropIndex(
                name: "IX_AudioTracks_UpdatedAt",
                table: "AudioTracks");

            migrationBuilder.CreateIndex(
                name: "IX_AudioTracks_POIId_LanguageCode",
                table: "AudioTracks",
                columns: new[] { "POIId", "LanguageCode" },
                unique: true);
        }
    }
}
