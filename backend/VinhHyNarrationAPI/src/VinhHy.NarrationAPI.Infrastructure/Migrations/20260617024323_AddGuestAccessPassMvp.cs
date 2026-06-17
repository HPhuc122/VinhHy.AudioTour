using System;
using Microsoft.EntityFrameworkCore.Migrations;

#nullable disable

namespace VinhHy.NarrationAPI.Infrastructure.Migrations
{
    /// <inheritdoc />
    public partial class AddGuestAccessPassMvp : Migration
    {
        /// <inheritdoc />
        protected override void Up(MigrationBuilder migrationBuilder)
        {
            migrationBuilder.AddColumn<int>(
                name: "AccessDurationMinutes",
                table: "QRLocations",
                type: "int",
                nullable: false,
                defaultValue: 60);

            migrationBuilder.AddColumn<decimal>(
                name: "PriceAmount",
                table: "QRLocations",
                type: "decimal(18,2)",
                precision: 18,
                scale: 2,
                nullable: false,
                defaultValue: 0m);

            migrationBuilder.AddColumn<bool>(
                name: "RequiresPayment",
                table: "QRLocations",
                type: "bit",
                nullable: false,
                defaultValue: false);

            migrationBuilder.CreateTable(
                name: "GuestAccessPasses",
                columns: table => new
                {
                    Id = table.Column<int>(type: "int", nullable: false)
                        .Annotation("SqlServer:Identity", "1, 1"),
                    TokenHash = table.Column<string>(type: "nvarchar(128)", maxLength: 128, nullable: true),
                    QrLocationId = table.Column<int>(type: "int", nullable: false),
                    StartsAt = table.Column<DateTime>(type: "datetime2", nullable: true),
                    ExpiresAt = table.Column<DateTime>(type: "datetime2", nullable: false),
                    IsPaid = table.Column<bool>(type: "bit", nullable: false),
                    Amount = table.Column<decimal>(type: "decimal(18,2)", precision: 18, scale: 2, nullable: false),
                    Currency = table.Column<string>(type: "nvarchar(8)", maxLength: 8, nullable: false, defaultValue: "VND"),
                    Status = table.Column<string>(type: "nvarchar(32)", maxLength: 32, nullable: false),
                    CreatedAt = table.Column<DateTime>(type: "datetime2", nullable: false, defaultValueSql: "SYSUTCDATETIME()"),
                    UpdatedAt = table.Column<DateTime>(type: "datetime2", nullable: false, defaultValueSql: "SYSUTCDATETIME()")
                },
                constraints: table =>
                {
                    table.PrimaryKey("PK_GuestAccessPasses", x => x.Id);
                    table.ForeignKey(
                        name: "FK_GuestAccessPasses_QRLocations_QrLocationId",
                        column: x => x.QrLocationId,
                        principalTable: "QRLocations",
                        principalColumn: "Id",
                        onDelete: ReferentialAction.Restrict);
                });

            migrationBuilder.CreateTable(
                name: "AccessPaymentSessions",
                columns: table => new
                {
                    Id = table.Column<int>(type: "int", nullable: false)
                        .Annotation("SqlServer:Identity", "1, 1"),
                    GuestAccessPassId = table.Column<int>(type: "int", nullable: false),
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
                    table.PrimaryKey("PK_AccessPaymentSessions", x => x.Id);
                    table.ForeignKey(
                        name: "FK_AccessPaymentSessions_GuestAccessPasses_GuestAccessPassId",
                        column: x => x.GuestAccessPassId,
                        principalTable: "GuestAccessPasses",
                        principalColumn: "Id",
                        onDelete: ReferentialAction.Cascade);
                });

            migrationBuilder.AddCheckConstraint(
                name: "CK_QRLocations_PaymentConfig",
                table: "QRLocations",
                sql: "[PriceAmount] >= 0 AND [AccessDurationMinutes] > 0");

            migrationBuilder.CreateIndex(
                name: "IX_AccessPaymentSessions_ExpiresAt",
                table: "AccessPaymentSessions",
                column: "ExpiresAt");

            migrationBuilder.CreateIndex(
                name: "IX_AccessPaymentSessions_GuestAccessPassId_Status",
                table: "AccessPaymentSessions",
                columns: new[] { "GuestAccessPassId", "Status" });

            migrationBuilder.CreateIndex(
                name: "IX_GuestAccessPasses_ExpiresAt",
                table: "GuestAccessPasses",
                column: "ExpiresAt");

            migrationBuilder.CreateIndex(
                name: "IX_GuestAccessPasses_QrLocationId_Status",
                table: "GuestAccessPasses",
                columns: new[] { "QrLocationId", "Status" });

            migrationBuilder.CreateIndex(
                name: "IX_GuestAccessPasses_TokenHash",
                table: "GuestAccessPasses",
                column: "TokenHash",
                unique: true,
                filter: "[TokenHash] IS NOT NULL");
        }

        /// <inheritdoc />
        protected override void Down(MigrationBuilder migrationBuilder)
        {
            migrationBuilder.DropTable(
                name: "AccessPaymentSessions");

            migrationBuilder.DropTable(
                name: "GuestAccessPasses");

            migrationBuilder.DropCheckConstraint(
                name: "CK_QRLocations_PaymentConfig",
                table: "QRLocations");

            migrationBuilder.DropColumn(
                name: "AccessDurationMinutes",
                table: "QRLocations");

            migrationBuilder.DropColumn(
                name: "PriceAmount",
                table: "QRLocations");

            migrationBuilder.DropColumn(
                name: "RequiresPayment",
                table: "QRLocations");
        }
    }
}
