using Microsoft.EntityFrameworkCore.Migrations;
using Microsoft.EntityFrameworkCore.Infrastructure;
using VinhHy.NarrationAPI.Infrastructure.Data;

#nullable disable

namespace VinhHy.NarrationAPI.Infrastructure.Migrations
{
    /// <inheritdoc />
    [DbContext(typeof(ApplicationDbContext))]
    [Migration("20260626000000_AddNarrationDraftTranslatingStatus")]
    public partial class AddNarrationDraftTranslatingStatus : Migration
    {
        /// <inheritdoc />
        protected override void Up(MigrationBuilder migrationBuilder)
        {
            // Mở rộng CHECK constraint để cho phép status 'Translating'
            // (trạng thái khi auto-translate + TTS pipeline đang chạy)
            migrationBuilder.DropCheckConstraint(
                name: "CK_NarrationDrafts_Status",
                table: "NarrationDrafts");

            migrationBuilder.AddCheckConstraint(
                name: "CK_NarrationDrafts_Status",
                table: "NarrationDrafts",
                sql: "[Status] IN ('Pending', 'Approved', 'Rejected', 'AudioGenerated', 'Translating')");
        }

        /// <inheritdoc />
        protected override void Down(MigrationBuilder migrationBuilder)
        {
            migrationBuilder.DropCheckConstraint(
                name: "CK_NarrationDrafts_Status",
                table: "NarrationDrafts");

            migrationBuilder.AddCheckConstraint(
                name: "CK_NarrationDrafts_Status",
                table: "NarrationDrafts",
                sql: "[Status] IN ('Pending', 'Approved', 'Rejected', 'AudioGenerated')");
        }
    }
}
