using Microsoft.EntityFrameworkCore.Migrations;
using Microsoft.EntityFrameworkCore.Infrastructure;
using VinhHy.NarrationAPI.Infrastructure.Data;

#nullable disable

namespace VinhHy.NarrationAPI.Infrastructure.Migrations
{
    /// <inheritdoc />
    [DbContext(typeof(ApplicationDbContext))]
    [Migration("20260623211500_AddMediaImageCategory")]
    public partial class AddMediaImageCategory : Migration
    {
        /// <inheritdoc />
        protected override void Up(MigrationBuilder migrationBuilder)
        {
            migrationBuilder.AddColumn<string>(
                name: "ImageCategory",
                table: "MediaFiles",
                type: "nvarchar(30)",
                maxLength: 30,
                nullable: true);

            migrationBuilder.Sql("UPDATE [MediaFiles] SET [ImageCategory] = 'Highlight' WHERE [FileType] = 'image' AND [ImageCategory] IS NULL");

            migrationBuilder.AddCheckConstraint(
                name: "CK_MediaFiles_ImageCategory",
                table: "MediaFiles",
                sql: "[ImageCategory] IS NULL OR [ImageCategory] IN ('Menu', 'Highlight')");
        }

        /// <inheritdoc />
        protected override void Down(MigrationBuilder migrationBuilder)
        {
            migrationBuilder.DropCheckConstraint(
                name: "CK_MediaFiles_ImageCategory",
                table: "MediaFiles");

            migrationBuilder.DropColumn(
                name: "ImageCategory",
                table: "MediaFiles");
        }
    }
}
