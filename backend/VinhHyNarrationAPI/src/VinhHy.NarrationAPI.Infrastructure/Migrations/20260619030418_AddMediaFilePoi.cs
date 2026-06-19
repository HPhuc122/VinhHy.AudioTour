using Microsoft.EntityFrameworkCore.Migrations;

#nullable disable

namespace VinhHy.NarrationAPI.Infrastructure.Migrations
{
    /// <inheritdoc />
    public partial class AddMediaFilePoi : Migration
    {
        /// <inheritdoc />
        protected override void Up(MigrationBuilder migrationBuilder)
        {
            migrationBuilder.AddColumn<int>(
                name: "PoiId",
                table: "MediaFiles",
                type: "int",
                nullable: true);

            migrationBuilder.CreateIndex(
                name: "IX_MediaFiles_PoiId",
                table: "MediaFiles",
                column: "PoiId");

            migrationBuilder.CreateIndex(
                name: "IX_MediaFiles_PoiId_FileType_ApprovalStatus",
                table: "MediaFiles",
                columns: new[] { "PoiId", "FileType", "ApprovalStatus" });

            migrationBuilder.AddForeignKey(
                name: "FK_MediaFiles_POIs_PoiId",
                table: "MediaFiles",
                column: "PoiId",
                principalTable: "POIs",
                principalColumn: "Id",
                onDelete: ReferentialAction.SetNull);
        }

        /// <inheritdoc />
        protected override void Down(MigrationBuilder migrationBuilder)
        {
            migrationBuilder.DropForeignKey(
                name: "FK_MediaFiles_POIs_PoiId",
                table: "MediaFiles");

            migrationBuilder.DropIndex(
                name: "IX_MediaFiles_PoiId",
                table: "MediaFiles");

            migrationBuilder.DropIndex(
                name: "IX_MediaFiles_PoiId_FileType_ApprovalStatus",
                table: "MediaFiles");

            migrationBuilder.DropColumn(
                name: "PoiId",
                table: "MediaFiles");
        }
    }
}
