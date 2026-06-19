using System;
using Microsoft.EntityFrameworkCore.Migrations;

#nullable disable

namespace VinhHy.NarrationAPI.Infrastructure.Migrations
{
    /// <inheritdoc />
    public partial class AddPoiLifecycleStatusAndValidity : Migration
    {
        /// <inheritdoc />
        protected override void Up(MigrationBuilder migrationBuilder)
        {
            migrationBuilder.AddColumn<byte>(
                name: "LifecycleStatus",
                table: "POIs",
                type: "tinyint",
                nullable: false,
                defaultValue: (byte)0);

            migrationBuilder.AddColumn<DateTime>(
                name: "ValidFrom",
                table: "POIs",
                type: "datetime2",
                nullable: true);

            migrationBuilder.AddColumn<DateTime>(
                name: "ValidUntil",
                table: "POIs",
                type: "datetime2",
                nullable: true);

            migrationBuilder.Sql(
                """
                UPDATE [POIs]
                SET [LifecycleStatus] = CASE
                    WHEN [ApprovalStatus] = 2 THEN 5
                    WHEN [ApprovalStatus] = 0 THEN 0
                    WHEN [IsActive] = 1 THEN 3
                    WHEN [ApprovalStatus] = 1 AND [PaymentStatus] = 1 THEN 2
                    WHEN [ApprovalStatus] = 1 THEN 1
                    ELSE 0
                END,
                [ValidFrom] = CASE
                    WHEN [IsActive] = 1 THEN COALESCE([ActivatedAt], [UpdatedAt], [CreatedAt])
                    ELSE [ValidFrom]
                END
                """);

            migrationBuilder.CreateIndex(
                name: "IX_POIs_LifecycleStatus",
                table: "POIs",
                column: "LifecycleStatus");

            migrationBuilder.CreateIndex(
                name: "IX_POIs_ValidUntil",
                table: "POIs",
                column: "ValidUntil");
        }

        /// <inheritdoc />
        protected override void Down(MigrationBuilder migrationBuilder)
        {
            migrationBuilder.DropIndex(
                name: "IX_POIs_LifecycleStatus",
                table: "POIs");

            migrationBuilder.DropIndex(
                name: "IX_POIs_ValidUntil",
                table: "POIs");

            migrationBuilder.DropColumn(
                name: "LifecycleStatus",
                table: "POIs");

            migrationBuilder.DropColumn(
                name: "ValidFrom",
                table: "POIs");

            migrationBuilder.DropColumn(
                name: "ValidUntil",
                table: "POIs");
        }
    }
}
