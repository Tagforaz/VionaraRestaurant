using System;
using Microsoft.EntityFrameworkCore.Migrations;

#nullable disable

namespace Restaurant.Persistence.Contexts.Migrations
{
    /// <inheritdoc />
    public partial class AddPasswordResetTokenEntity : Migration
    {
        /// <inheritdoc />
        protected override void Up(MigrationBuilder migrationBuilder)
        {
            migrationBuilder.DropForeignKey(
                name: "FK_Orders_Table_TableId",
                table: "Orders");

            migrationBuilder.DropForeignKey(
                name: "FK_Reservations_Table_TableId",
                table: "Reservations");

            migrationBuilder.DropPrimaryKey(
                name: "PK_Table",
                table: "Table");

            migrationBuilder.RenameTable(
                name: "Table",
                newName: "Tables");

            migrationBuilder.RenameIndex(
                name: "IX_Table_TableNumber",
                table: "Tables",
                newName: "IX_Tables_TableNumber");

            migrationBuilder.RenameIndex(
                name: "IX_Table_PositionX_PositionY",
                table: "Tables",
                newName: "IX_Tables_PositionX_PositionY");

            migrationBuilder.RenameIndex(
                name: "IX_Table_IsAvailable",
                table: "Tables",
                newName: "IX_Tables_IsAvailable");

            migrationBuilder.AddPrimaryKey(
                name: "PK_Tables",
                table: "Tables",
                column: "Id");

            migrationBuilder.CreateTable(
                name: "PasswordResetTokens",
                columns: table => new
                {
                    Id = table.Column<Guid>(type: "uniqueidentifier", nullable: false),
                    UserId = table.Column<Guid>(type: "uniqueidentifier", nullable: false),
                    Code = table.Column<string>(type: "nvarchar(10)", maxLength: 10, nullable: false),
                    ExpiresAt = table.Column<DateTime>(type: "datetime2", nullable: false),
                    IsUsed = table.Column<bool>(type: "bit", nullable: false, defaultValue: false),
                    UsedAt = table.Column<DateTime>(type: "datetime2", nullable: true),
                    CreatedAt = table.Column<DateTime>(type: "datetime2", nullable: false),
                    CreatedBy = table.Column<string>(type: "nvarchar(max)", nullable: true),
                    UpdatedAt = table.Column<DateTime>(type: "datetime2", nullable: true),
                    UpdatedBy = table.Column<string>(type: "nvarchar(max)", nullable: true)
                },
                constraints: table =>
                {
                    table.PrimaryKey("PK_PasswordResetTokens", x => x.Id);
                    table.ForeignKey(
                        name: "FK_PasswordResetTokens_AspNetUsers_UserId",
                        column: x => x.UserId,
                        principalTable: "AspNetUsers",
                        principalColumn: "Id",
                        onDelete: ReferentialAction.Cascade);
                });

            migrationBuilder.CreateIndex(
                name: "IX_PasswordResetTokens_ExpiresAt",
                table: "PasswordResetTokens",
                column: "ExpiresAt");

            migrationBuilder.CreateIndex(
                name: "IX_PasswordResetTokens_IsUsed",
                table: "PasswordResetTokens",
                column: "IsUsed");

            migrationBuilder.CreateIndex(
                name: "IX_PasswordResetTokens_UserId_Code",
                table: "PasswordResetTokens",
                columns: new[] { "UserId", "Code" });

            migrationBuilder.AddForeignKey(
                name: "FK_Orders_Tables_TableId",
                table: "Orders",
                column: "TableId",
                principalTable: "Tables",
                principalColumn: "Id",
                onDelete: ReferentialAction.SetNull);

            migrationBuilder.AddForeignKey(
                name: "FK_Reservations_Tables_TableId",
                table: "Reservations",
                column: "TableId",
                principalTable: "Tables",
                principalColumn: "Id",
                onDelete: ReferentialAction.SetNull);
        }

        /// <inheritdoc />
        protected override void Down(MigrationBuilder migrationBuilder)
        {
            migrationBuilder.DropForeignKey(
                name: "FK_Orders_Tables_TableId",
                table: "Orders");

            migrationBuilder.DropForeignKey(
                name: "FK_Reservations_Tables_TableId",
                table: "Reservations");

            migrationBuilder.DropTable(
                name: "PasswordResetTokens");

            migrationBuilder.DropPrimaryKey(
                name: "PK_Tables",
                table: "Tables");

            migrationBuilder.RenameTable(
                name: "Tables",
                newName: "Table");

            migrationBuilder.RenameIndex(
                name: "IX_Tables_TableNumber",
                table: "Table",
                newName: "IX_Table_TableNumber");

            migrationBuilder.RenameIndex(
                name: "IX_Tables_PositionX_PositionY",
                table: "Table",
                newName: "IX_Table_PositionX_PositionY");

            migrationBuilder.RenameIndex(
                name: "IX_Tables_IsAvailable",
                table: "Table",
                newName: "IX_Table_IsAvailable");

            migrationBuilder.AddPrimaryKey(
                name: "PK_Table",
                table: "Table",
                column: "Id");

            migrationBuilder.AddForeignKey(
                name: "FK_Orders_Table_TableId",
                table: "Orders",
                column: "TableId",
                principalTable: "Table",
                principalColumn: "Id",
                onDelete: ReferentialAction.SetNull);

            migrationBuilder.AddForeignKey(
                name: "FK_Reservations_Table_TableId",
                table: "Reservations",
                column: "TableId",
                principalTable: "Table",
                principalColumn: "Id",
                onDelete: ReferentialAction.SetNull);
        }
    }
}
