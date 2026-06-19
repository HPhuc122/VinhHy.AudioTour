using System;
using Microsoft.EntityFrameworkCore.Migrations;

#nullable disable

namespace VinhHy.NarrationAPI.Infrastructure.Migrations
{
    /// <inheritdoc />
    public partial class AddPoiPaymentSessions : Migration
    {
        /// <inheritdoc />
        protected override void Up(MigrationBuilder migrationBuilder)
        {
            migrationBuilder.CreateTable(
                name: "PoiPaymentSessions",
                columns: table => new
                {
                    Id = table.Column<int>(type: "int", nullable: false)
                        .Annotation("SqlServer:Identity", "1, 1"),
                    PoiId = table.Column<int>(type: "int", nullable: false),
                    VendorUserId = table.Column<int>(type: "int", nullable: false),
                    Provider = table.Column<string>(type: "nvarchar(32)", maxLength: 32, nullable: false, defaultValue: "SimulatedMoMo"),
                    Status = table.Column<string>(type: "nvarchar(32)", maxLength: 32, nullable: false),
                    Amount = table.Column<decimal>(type: "decimal(18,2)", precision: 18, scale: 2, nullable: false),
                    Currency = table.Column<string>(type: "nvarchar(8)", maxLength: 8, nullable: false, defaultValue: "VND"),
                    CreatedAt = table.Column<DateTime>(type: "datetime2", nullable: false, defaultValueSql: "SYSUTCDATETIME()"),
                    ExpiresAt = table.Column<DateTime>(type: "datetime2", nullable: false),
                    PaidAt = table.Column<DateTime>(type: "datetime2", nullable: true),
                    FailureReason = table.Column<string>(type: "nvarchar(500)", maxLength: 500, nullable: true)
                },
                constraints: table =>
                {
                    table.PrimaryKey("PK_PoiPaymentSessions", x => x.Id);
                    table.CheckConstraint("CK_PoiPaymentSessions_Amount", "[Amount] >= 0");
                    table.CheckConstraint("CK_PoiPaymentSessions_Status", "[Status] IN ('Pending', 'Paid', 'Failed', 'Expired')");
                    table.ForeignKey(
                        name: "FK_PoiPaymentSessions_POIs_PoiId",
                        column: x => x.PoiId,
                        principalTable: "POIs",
                        principalColumn: "Id",
                        onDelete: ReferentialAction.Cascade);
                    table.ForeignKey(
                        name: "FK_PoiPaymentSessions_Users_VendorUserId",
                        column: x => x.VendorUserId,
                        principalTable: "Users",
                        principalColumn: "Id");
                });

            migrationBuilder.CreateIndex(
                name: "IX_PoiPaymentSessions_ExpiresAt",
                table: "PoiPaymentSessions",
                column: "ExpiresAt");

            migrationBuilder.CreateIndex(
                name: "IX_PoiPaymentSessions_PoiId_Status",
                table: "PoiPaymentSessions",
                columns: new[] { "PoiId", "Status" });

            migrationBuilder.CreateIndex(
                name: "IX_PoiPaymentSessions_VendorUserId_Status",
                table: "PoiPaymentSessions",
                columns: new[] { "VendorUserId", "Status" });
        }

        /// <inheritdoc />
        protected override void Down(MigrationBuilder migrationBuilder)
        {
            migrationBuilder.DropTable(
                name: "PoiPaymentSessions");
        }
    }
}
