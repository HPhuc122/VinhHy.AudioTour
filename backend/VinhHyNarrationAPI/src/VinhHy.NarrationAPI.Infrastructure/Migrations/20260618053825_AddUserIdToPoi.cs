using Microsoft.EntityFrameworkCore.Migrations;

#nullable disable

namespace VinhHy.NarrationAPI.Infrastructure.Migrations
{
    /// <inheritdoc />
    public partial class AddUserIdToPoi : Migration
    {
        /// <inheritdoc />
        protected override void Up(MigrationBuilder migrationBuilder)
        {
            migrationBuilder.AddColumn<int>(
                name: "UserId",
                table: "POIs",
                type: "int",
                nullable: true);

            migrationBuilder.CreateIndex(
                name: "IX_POIs_UserId",
                table: "POIs",
                column: "UserId");

            migrationBuilder.AddForeignKey(
                name: "FK_POIs_Users_UserId",
                table: "POIs",
                column: "UserId",
                principalTable: "Users",
                principalColumn: "Id",
                onDelete: ReferentialAction.Restrict);
        }

        /// <inheritdoc />
        protected override void Down(MigrationBuilder migrationBuilder)
        {
            migrationBuilder.DropForeignKey(
                name: "FK_POIs_Users_UserId",
                table: "POIs");

            migrationBuilder.DropIndex(
                name: "IX_POIs_UserId",
                table: "POIs");

            migrationBuilder.DropColumn(
                name: "UserId",
                table: "POIs");
        }
    }
}
