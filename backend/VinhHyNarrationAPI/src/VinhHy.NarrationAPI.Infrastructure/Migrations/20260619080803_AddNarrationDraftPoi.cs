using Microsoft.EntityFrameworkCore.Migrations;

#nullable disable

namespace VinhHy.NarrationAPI.Infrastructure.Migrations
{
    /// <inheritdoc />
    public partial class AddNarrationDraftPoi : Migration
    {
        /// <inheritdoc />
        protected override void Up(MigrationBuilder migrationBuilder)
        {
            migrationBuilder.AddColumn<int>(
                name: "PoiId",
                table: "NarrationDrafts",
                type: "int",
                nullable: true);

            migrationBuilder.Sql("""
                IF EXISTS (SELECT 1 FROM [NarrationDrafts])
                   AND NOT EXISTS (SELECT 1 FROM [POIs] WHERE [DeletedAt] IS NULL)
                BEGIN
                    THROW 51000, 'Cannot bind existing narration drafts to POIs because no active POI exists.', 1;
                END

                UPDATE [NarrationDrafts]
                SET [PoiId] = COALESCE(
                    (
                        SELECT TOP(1) [POIs].[Id]
                        FROM [POIs]
                        WHERE [POIs].[UserId] = [NarrationDrafts].[SubmittedByUserId]
                          AND [POIs].[DeletedAt] IS NULL
                        ORDER BY [POIs].[Id]
                    ),
                    (
                        SELECT TOP(1) [POIs].[Id]
                        FROM [POIs]
                        WHERE [POIs].[DeletedAt] IS NULL
                        ORDER BY [POIs].[Id]
                    ))
                WHERE [PoiId] IS NULL;
                """);

            migrationBuilder.AlterColumn<int>(
                name: "PoiId",
                table: "NarrationDrafts",
                type: "int",
                nullable: false,
                oldClrType: typeof(int),
                oldType: "int",
                oldNullable: true);

            migrationBuilder.CreateIndex(
                name: "IX_NarrationDrafts_PoiId",
                table: "NarrationDrafts",
                column: "PoiId");

            migrationBuilder.CreateIndex(
                name: "IX_NarrationDrafts_PoiId_Status",
                table: "NarrationDrafts",
                columns: new[] { "PoiId", "Status" });

            migrationBuilder.AddForeignKey(
                name: "FK_NarrationDrafts_POIs_PoiId",
                table: "NarrationDrafts",
                column: "PoiId",
                principalTable: "POIs",
                principalColumn: "Id",
                onDelete: ReferentialAction.Cascade);
        }

        /// <inheritdoc />
        protected override void Down(MigrationBuilder migrationBuilder)
        {
            migrationBuilder.DropForeignKey(
                name: "FK_NarrationDrafts_POIs_PoiId",
                table: "NarrationDrafts");

            migrationBuilder.DropIndex(
                name: "IX_NarrationDrafts_PoiId",
                table: "NarrationDrafts");

            migrationBuilder.DropIndex(
                name: "IX_NarrationDrafts_PoiId_Status",
                table: "NarrationDrafts");

            migrationBuilder.DropColumn(
                name: "PoiId",
                table: "NarrationDrafts");
        }
    }
}
