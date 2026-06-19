using System;
using Microsoft.EntityFrameworkCore.Migrations;

#nullable disable

namespace VinhHy.NarrationAPI.Infrastructure.Migrations
{
    /// <inheritdoc />
    public partial class AddMediaApprovalAndNarrationDrafts : Migration
    {
        /// <inheritdoc />
        protected override void Up(MigrationBuilder migrationBuilder)
        {
            migrationBuilder.DropIndex(
                name: "IX_MediaFiles_UploadedByUserId",
                table: "MediaFiles");

            migrationBuilder.AddColumn<string>(
                name: "ApprovalStatus",
                table: "MediaFiles",
                type: "nvarchar(20)",
                maxLength: 20,
                nullable: false,
                defaultValue: "Pending");

            migrationBuilder.AddColumn<string>(
                name: "RejectionReason",
                table: "MediaFiles",
                type: "nvarchar(1000)",
                maxLength: 1000,
                nullable: true);

            migrationBuilder.AddColumn<DateTime>(
                name: "ReviewedAt",
                table: "MediaFiles",
                type: "datetime2",
                nullable: true);

            migrationBuilder.AddColumn<int>(
                name: "ReviewedByUserId",
                table: "MediaFiles",
                type: "int",
                nullable: true);

            migrationBuilder.AddColumn<DateTime>(
                name: "SubmittedAt",
                table: "MediaFiles",
                type: "datetime2",
                nullable: true);

            migrationBuilder.Sql(
                "UPDATE [MediaFiles] SET [ApprovalStatus] = 'Approved', [SubmittedAt] = COALESCE([SubmittedAt], [UploadedAt])");

            migrationBuilder.CreateTable(
                name: "NarrationDrafts",
                columns: table => new
                {
                    Id = table.Column<int>(type: "int", nullable: false)
                        .Annotation("SqlServer:Identity", "1, 1"),
                    Title = table.Column<string>(type: "nvarchar(200)", maxLength: 200, nullable: false),
                    LanguageCode = table.Column<string>(type: "nvarchar(10)", maxLength: 10, nullable: false),
                    TextContent = table.Column<string>(type: "nvarchar(max)", maxLength: 8000, nullable: false),
                    Voice = table.Column<string>(type: "nvarchar(100)", maxLength: 100, nullable: false),
                    Status = table.Column<string>(type: "nvarchar(30)", maxLength: 30, nullable: false, defaultValue: "Pending"),
                    SubmittedByUserId = table.Column<int>(type: "int", nullable: false),
                    SubmittedAt = table.Column<DateTime>(type: "datetime2", nullable: false, defaultValueSql: "SYSUTCDATETIME()"),
                    ReviewedByUserId = table.Column<int>(type: "int", nullable: true),
                    ReviewedAt = table.Column<DateTime>(type: "datetime2", nullable: true),
                    RejectionReason = table.Column<string>(type: "nvarchar(1000)", maxLength: 1000, nullable: true),
                    GeneratedAudioTrackId = table.Column<int>(type: "int", nullable: true),
                    AudioGeneratedAt = table.Column<DateTime>(type: "datetime2", nullable: true),
                    SimulatedAudioUrl = table.Column<string>(type: "nvarchar(500)", maxLength: 500, nullable: true),
                    CreatedAt = table.Column<DateTime>(type: "datetime2", nullable: false, defaultValueSql: "SYSUTCDATETIME()"),
                    UpdatedAt = table.Column<DateTime>(type: "datetime2", nullable: false, defaultValueSql: "SYSUTCDATETIME()")
                },
                constraints: table =>
                {
                    table.PrimaryKey("PK_NarrationDrafts", x => x.Id);
                    table.CheckConstraint("CK_NarrationDrafts_Status", "[Status] IN ('Pending', 'Approved', 'Rejected', 'AudioGenerated')");
                    table.ForeignKey(
                        name: "FK_NarrationDrafts_AudioTracks_GeneratedAudioTrackId",
                        column: x => x.GeneratedAudioTrackId,
                        principalTable: "AudioTracks",
                        principalColumn: "Id",
                        onDelete: ReferentialAction.SetNull);
                    table.ForeignKey(
                        name: "FK_NarrationDrafts_Users_ReviewedByUserId",
                        column: x => x.ReviewedByUserId,
                        principalTable: "Users",
                        principalColumn: "Id",
                        onDelete: ReferentialAction.SetNull);
                    table.ForeignKey(
                        name: "FK_NarrationDrafts_Users_SubmittedByUserId",
                        column: x => x.SubmittedByUserId,
                        principalTable: "Users",
                        principalColumn: "Id",
                        onDelete: ReferentialAction.Restrict);
                });

            migrationBuilder.CreateIndex(
                name: "IX_MediaFiles_ApprovalStatus",
                table: "MediaFiles",
                column: "ApprovalStatus");

            migrationBuilder.CreateIndex(
                name: "IX_MediaFiles_ReviewedByUserId",
                table: "MediaFiles",
                column: "ReviewedByUserId");

            migrationBuilder.CreateIndex(
                name: "IX_MediaFiles_UploadedByUserId_FileType_ApprovalStatus",
                table: "MediaFiles",
                columns: new[] { "UploadedByUserId", "FileType", "ApprovalStatus" });

            migrationBuilder.AddCheckConstraint(
                name: "CK_MediaFiles_ApprovalStatus",
                table: "MediaFiles",
                sql: "[ApprovalStatus] IN ('Pending', 'Approved', 'Rejected')");

            migrationBuilder.CreateIndex(
                name: "IX_NarrationDrafts_GeneratedAudioTrackId",
                table: "NarrationDrafts",
                column: "GeneratedAudioTrackId");

            migrationBuilder.CreateIndex(
                name: "IX_NarrationDrafts_ReviewedByUserId",
                table: "NarrationDrafts",
                column: "ReviewedByUserId");

            migrationBuilder.CreateIndex(
                name: "IX_NarrationDrafts_Status",
                table: "NarrationDrafts",
                column: "Status");

            migrationBuilder.CreateIndex(
                name: "IX_NarrationDrafts_SubmittedAt",
                table: "NarrationDrafts",
                column: "SubmittedAt");

            migrationBuilder.CreateIndex(
                name: "IX_NarrationDrafts_SubmittedByUserId_Status",
                table: "NarrationDrafts",
                columns: new[] { "SubmittedByUserId", "Status" });

            migrationBuilder.AddForeignKey(
                name: "FK_MediaFiles_Users_ReviewedByUserId",
                table: "MediaFiles",
                column: "ReviewedByUserId",
                principalTable: "Users",
                principalColumn: "Id");
        }

        /// <inheritdoc />
        protected override void Down(MigrationBuilder migrationBuilder)
        {
            migrationBuilder.DropForeignKey(
                name: "FK_MediaFiles_Users_ReviewedByUserId",
                table: "MediaFiles");

            migrationBuilder.DropTable(
                name: "NarrationDrafts");

            migrationBuilder.DropIndex(
                name: "IX_MediaFiles_ApprovalStatus",
                table: "MediaFiles");

            migrationBuilder.DropIndex(
                name: "IX_MediaFiles_ReviewedByUserId",
                table: "MediaFiles");

            migrationBuilder.DropIndex(
                name: "IX_MediaFiles_UploadedByUserId_FileType_ApprovalStatus",
                table: "MediaFiles");

            migrationBuilder.DropCheckConstraint(
                name: "CK_MediaFiles_ApprovalStatus",
                table: "MediaFiles");

            migrationBuilder.DropColumn(
                name: "ApprovalStatus",
                table: "MediaFiles");

            migrationBuilder.DropColumn(
                name: "RejectionReason",
                table: "MediaFiles");

            migrationBuilder.DropColumn(
                name: "ReviewedAt",
                table: "MediaFiles");

            migrationBuilder.DropColumn(
                name: "ReviewedByUserId",
                table: "MediaFiles");

            migrationBuilder.DropColumn(
                name: "SubmittedAt",
                table: "MediaFiles");

            migrationBuilder.CreateIndex(
                name: "IX_MediaFiles_UploadedByUserId",
                table: "MediaFiles",
                column: "UploadedByUserId");
        }
    }
}
