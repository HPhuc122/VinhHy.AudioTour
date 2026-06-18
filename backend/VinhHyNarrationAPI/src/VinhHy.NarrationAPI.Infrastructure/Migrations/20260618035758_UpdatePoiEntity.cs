using Microsoft.EntityFrameworkCore.Migrations;

#nullable disable

namespace VinhHy.NarrationAPI.Infrastructure.Migrations
{
    /// <inheritdoc />
    public partial class UpdatePoiEntity : Migration
    {
        /// <inheritdoc />
        protected override void Up(MigrationBuilder migrationBuilder)
        {
            migrationBuilder.AddColumn<string>(
                name: "ImageUrls",
                table: "POIs",
                type: "nvarchar(max)",
                nullable: true);
        }

        /// <inheritdoc />
        protected override void Down(MigrationBuilder migrationBuilder)
        {
            migrationBuilder.DropColumn(
                name: "ImageUrls",
                table: "POIs");
        }
    }
}
