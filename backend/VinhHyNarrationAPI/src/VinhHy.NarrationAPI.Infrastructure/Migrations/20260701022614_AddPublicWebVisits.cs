using System;
using Microsoft.EntityFrameworkCore.Migrations;

#nullable disable

namespace VinhHy.NarrationAPI.Infrastructure.Migrations
{
    /// <inheritdoc />
    public partial class AddPublicWebVisits : Migration
    {
        /// <inheritdoc />
        protected override void Up(MigrationBuilder migrationBuilder)
        {
            migrationBuilder.CreateTable(
                name: "PublicWebVisits",
                columns: table => new
                {
                    Id = table.Column<long>(type: "bigint", nullable: false)
                        .Annotation("SqlServer:Identity", "1, 1"),
                    SessionId = table.Column<string>(type: "nvarchar(128)", maxLength: 128, nullable: false),
                    VisitDate = table.Column<DateOnly>(type: "date", nullable: false),
                    FirstSeenAt = table.Column<DateTime>(type: "datetime2", nullable: false, defaultValueSql: "GETUTCDATE()")
                },
                constraints: table =>
                {
                    table.PrimaryKey("PK_PublicWebVisits", x => x.Id);
                });

            migrationBuilder.CreateIndex(
                name: "IX_PublicWebVisits_SessionId_VisitDate",
                table: "PublicWebVisits",
                columns: new[] { "SessionId", "VisitDate" },
                unique: true);

            migrationBuilder.CreateIndex(
                name: "IX_PublicWebVisits_VisitDate",
                table: "PublicWebVisits",
                column: "VisitDate");
        }

        /// <inheritdoc />
        protected override void Down(MigrationBuilder migrationBuilder)
        {
            migrationBuilder.DropTable(
                name: "PublicWebVisits");
        }
    }
}
