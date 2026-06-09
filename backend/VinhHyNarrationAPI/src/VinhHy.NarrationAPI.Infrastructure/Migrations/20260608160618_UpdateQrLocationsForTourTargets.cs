using System;
using Microsoft.EntityFrameworkCore.Migrations;

#nullable disable

namespace VinhHy.NarrationAPI.Infrastructure.Migrations
{
    /// <inheritdoc />
    public partial class UpdateQrLocationsForTourTargets : Migration
    {
        /// <inheritdoc />
        protected override void Up(MigrationBuilder migrationBuilder)
        {
            migrationBuilder.DropForeignKey(
                name: "FK_QRLocations_POIs_POIId",
                table: "QRLocations");

            migrationBuilder.DropColumn(
                name: "ExpiresAt",
                table: "QRLocations");

            migrationBuilder.DropColumn(
                name: "Label",
                table: "QRLocations");

            migrationBuilder.RenameColumn(
                name: "POIId",
                table: "QRLocations",
                newName: "PoiId");

            migrationBuilder.RenameColumn(
                name: "QRCode",
                table: "QRLocations",
                newName: "Code");

            migrationBuilder.RenameIndex(
                name: "IX_QRLocations_POIId",
                table: "QRLocations",
                newName: "IX_QRLocations_PoiId");

            migrationBuilder.RenameIndex(
                name: "IX_QRLocations_QRCode",
                table: "QRLocations",
                newName: "IX_QRLocations_Code");

            migrationBuilder.AlterColumn<int>(
                name: "PoiId",
                table: "QRLocations",
                type: "int",
                nullable: true,
                oldClrType: typeof(int),
                oldType: "int");

            migrationBuilder.AddColumn<int>(
                name: "TourId",
                table: "QRLocations",
                type: "int",
                nullable: true);

            migrationBuilder.AddColumn<DateTime>(
                name: "UpdatedAt",
                table: "QRLocations",
                type: "datetime2",
                nullable: false,
                defaultValueSql: "SYSUTCDATETIME()");

            migrationBuilder.CreateIndex(
                name: "IX_QRLocations_DeletedAt",
                table: "QRLocations",
                column: "DeletedAt",
                filter: "[DeletedAt] IS NOT NULL");

            migrationBuilder.CreateIndex(
                name: "IX_QRLocations_TourId",
                table: "QRLocations",
                column: "TourId");

            migrationBuilder.AddCheckConstraint(
                name: "CK_QRLocations_Target",
                table: "QRLocations",
                sql: "([PoiId] IS NOT NULL AND [TourId] IS NULL) OR ([PoiId] IS NULL AND [TourId] IS NOT NULL)");

            migrationBuilder.AddForeignKey(
                name: "FK_QRLocations_POIs_PoiId",
                table: "QRLocations",
                column: "PoiId",
                principalTable: "POIs",
                principalColumn: "Id",
                onDelete: ReferentialAction.Restrict);

            migrationBuilder.AddForeignKey(
                name: "FK_QRLocations_Tours_TourId",
                table: "QRLocations",
                column: "TourId",
                principalTable: "Tours",
                principalColumn: "Id",
                onDelete: ReferentialAction.Restrict);
        }

        /// <inheritdoc />
        protected override void Down(MigrationBuilder migrationBuilder)
        {
            migrationBuilder.DropForeignKey(
                name: "FK_QRLocations_POIs_PoiId",
                table: "QRLocations");

            migrationBuilder.DropForeignKey(
                name: "FK_QRLocations_Tours_TourId",
                table: "QRLocations");

            migrationBuilder.DropIndex(
                name: "IX_QRLocations_DeletedAt",
                table: "QRLocations");

            migrationBuilder.DropIndex(
                name: "IX_QRLocations_TourId",
                table: "QRLocations");

            migrationBuilder.DropCheckConstraint(
                name: "CK_QRLocations_Target",
                table: "QRLocations");

            migrationBuilder.DropColumn(
                name: "TourId",
                table: "QRLocations");

            migrationBuilder.DropColumn(
                name: "UpdatedAt",
                table: "QRLocations");

            migrationBuilder.RenameColumn(
                name: "PoiId",
                table: "QRLocations",
                newName: "POIId");

            migrationBuilder.RenameColumn(
                name: "Code",
                table: "QRLocations",
                newName: "QRCode");

            migrationBuilder.RenameIndex(
                name: "IX_QRLocations_PoiId",
                table: "QRLocations",
                newName: "IX_QRLocations_POIId");

            migrationBuilder.RenameIndex(
                name: "IX_QRLocations_Code",
                table: "QRLocations",
                newName: "IX_QRLocations_QRCode");

            migrationBuilder.AlterColumn<int>(
                name: "POIId",
                table: "QRLocations",
                type: "int",
                nullable: false,
                defaultValue: 0,
                oldClrType: typeof(int),
                oldType: "int",
                oldNullable: true);

            migrationBuilder.AddColumn<DateTime>(
                name: "ExpiresAt",
                table: "QRLocations",
                type: "datetime2",
                nullable: true);

            migrationBuilder.AddColumn<string>(
                name: "Label",
                table: "QRLocations",
                type: "nvarchar(200)",
                maxLength: 200,
                nullable: true);

            migrationBuilder.AddForeignKey(
                name: "FK_QRLocations_POIs_POIId",
                table: "QRLocations",
                column: "POIId",
                principalTable: "POIs",
                principalColumn: "Id",
                onDelete: ReferentialAction.Restrict);
        }
    }
}
