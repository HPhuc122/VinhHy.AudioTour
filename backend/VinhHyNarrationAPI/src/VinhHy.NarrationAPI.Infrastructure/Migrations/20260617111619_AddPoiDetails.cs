using Microsoft.EntityFrameworkCore.Migrations;

#nullable disable

namespace VinhHy.NarrationAPI.Infrastructure.Migrations
{
    /// <inheritdoc />
    public partial class AddPoiDetails : Migration
    {
        /// <inheritdoc />
        protected override void Up(MigrationBuilder migrationBuilder)
        {
            migrationBuilder.AddColumn<byte>(
                name: "ApprovalStatus",
                table: "POIs",
                type: "tinyint",
                nullable: false,
                defaultValue: (byte)0);

            migrationBuilder.AddColumn<string>(
                name: "Description",
                table: "POIs",
                type: "nvarchar(max)",
                nullable: true);

            migrationBuilder.AddColumn<string>(
                name: "Name",
                table: "POIs",
                type: "nvarchar(max)",
                nullable: false,
                defaultValue: "");

            migrationBuilder.AddColumn<string>(
                name: "ShortDescription",
                table: "POIs",
                type: "nvarchar(max)",
                nullable: true);
        }

        /// <inheritdoc />
        protected override void Down(MigrationBuilder migrationBuilder)
        {
            migrationBuilder.DropColumn(
                name: "ApprovalStatus",
                table: "POIs");

            migrationBuilder.DropColumn(
                name: "Description",
                table: "POIs");

            migrationBuilder.DropColumn(
                name: "Name",
                table: "POIs");

            migrationBuilder.DropColumn(
                name: "ShortDescription",
                table: "POIs");
        }
    }
}
