using System;
using Microsoft.EntityFrameworkCore.Migrations;

#nullable disable

namespace VinhHy.NarrationAPI.Infrastructure.Migrations
{
    /// <inheritdoc />
    public partial class AddPoiActivationPaymentFields : Migration
    {
        /// <inheritdoc />
        protected override void Up(MigrationBuilder migrationBuilder)
        {
            migrationBuilder.AddColumn<DateTime>(
                name: "ActivatedAt",
                table: "POIs",
                type: "datetime2",
                nullable: true);

            migrationBuilder.AddColumn<int>(
                name: "ActivatedByUserId",
                table: "POIs",
                type: "int",
                nullable: true);

            migrationBuilder.AddColumn<bool>(
                name: "PaymentRequired",
                table: "POIs",
                type: "bit",
                nullable: false,
                defaultValue: false);

            migrationBuilder.AddColumn<byte>(
                name: "PaymentStatus",
                table: "POIs",
                type: "tinyint",
                nullable: false,
                defaultValue: (byte)0);

            migrationBuilder.CreateIndex(
                name: "IX_POIs_ActivatedByUserId",
                table: "POIs",
                column: "ActivatedByUserId");

            migrationBuilder.CreateIndex(
                name: "IX_POIs_PaymentStatus",
                table: "POIs",
                column: "PaymentStatus");

            migrationBuilder.AddForeignKey(
                name: "FK_POIs_Users_ActivatedByUserId",
                table: "POIs",
                column: "ActivatedByUserId",
                principalTable: "Users",
                principalColumn: "Id");
        }

        /// <inheritdoc />
        protected override void Down(MigrationBuilder migrationBuilder)
        {
            migrationBuilder.DropForeignKey(
                name: "FK_POIs_Users_ActivatedByUserId",
                table: "POIs");

            migrationBuilder.DropIndex(
                name: "IX_POIs_ActivatedByUserId",
                table: "POIs");

            migrationBuilder.DropIndex(
                name: "IX_POIs_PaymentStatus",
                table: "POIs");

            migrationBuilder.DropColumn(
                name: "ActivatedAt",
                table: "POIs");

            migrationBuilder.DropColumn(
                name: "ActivatedByUserId",
                table: "POIs");

            migrationBuilder.DropColumn(
                name: "PaymentRequired",
                table: "POIs");

            migrationBuilder.DropColumn(
                name: "PaymentStatus",
                table: "POIs");
        }
    }
}
