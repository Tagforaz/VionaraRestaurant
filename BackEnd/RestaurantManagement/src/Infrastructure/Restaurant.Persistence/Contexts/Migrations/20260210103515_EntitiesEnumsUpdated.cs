using System;
using Microsoft.EntityFrameworkCore.Migrations;

#nullable disable

namespace Restaurant.Persistence.Contexts.Migrations
{
    /// <inheritdoc />
    public partial class EntitiesEnumsUpdated : Migration
    {
        /// <inheritdoc />
        protected override void Up(MigrationBuilder migrationBuilder)
        {
            migrationBuilder.DropColumn(
                name: "TableNumber",
                table: "Reservations");

            migrationBuilder.DropColumn(
                name: "TableNumber",
                table: "Orders");

            migrationBuilder.RenameColumn(
                name: "CustomerPhone",
                table: "Reservations",
                newName: "CustomerPhoneNumber");

            migrationBuilder.AddColumn<string>(
                name: "CustomerPhoneCountryCode",
                table: "Reservations",
                type: "nvarchar(10)",
                maxLength: 10,
                nullable: false,
                defaultValue: "");

            migrationBuilder.AddColumn<Guid>(
                name: "TableId",
                table: "Reservations",
                type: "uniqueidentifier",
                nullable: true);

            migrationBuilder.AddColumn<Guid>(
                name: "TableId",
                table: "Orders",
                type: "uniqueidentifier",
                nullable: true);

            migrationBuilder.CreateTable(
                name: "Table",
                columns: table => new
                {
                    Id = table.Column<Guid>(type: "uniqueidentifier", nullable: false),
                    TableNumber = table.Column<int>(type: "int", nullable: false),
                    Capacity = table.Column<int>(type: "int", nullable: false),
                    IsAvailable = table.Column<bool>(type: "bit", nullable: false),
                    CreatedAt = table.Column<DateTime>(type: "datetime2", nullable: false),
                    CreatedBy = table.Column<string>(type: "nvarchar(max)", nullable: true),
                    UpdatedAt = table.Column<DateTime>(type: "datetime2", nullable: true),
                    UpdatedBy = table.Column<string>(type: "nvarchar(max)", nullable: true)
                },
                constraints: table =>
                {
                    table.PrimaryKey("PK_Table", x => x.Id);
                });

            migrationBuilder.CreateIndex(
                name: "IX_Reservations_Date_Time",
                table: "Reservations",
                columns: new[] { "Date", "Time" });

            migrationBuilder.CreateIndex(
                name: "IX_Reservations_TableId",
                table: "Reservations",
                column: "TableId");

            migrationBuilder.CreateIndex(
                name: "IX_Orders_TableId",
                table: "Orders",
                column: "TableId");

            migrationBuilder.CreateIndex(
                name: "IX_Table_IsAvailable",
                table: "Table",
                column: "IsAvailable");

            migrationBuilder.CreateIndex(
                name: "IX_Table_TableNumber",
                table: "Table",
                column: "TableNumber",
                unique: true);

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

        /// <inheritdoc />
        protected override void Down(MigrationBuilder migrationBuilder)
        {
            migrationBuilder.DropForeignKey(
                name: "FK_Orders_Table_TableId",
                table: "Orders");

            migrationBuilder.DropForeignKey(
                name: "FK_Reservations_Table_TableId",
                table: "Reservations");

            migrationBuilder.DropTable(
                name: "Table");

            migrationBuilder.DropIndex(
                name: "IX_Reservations_Date_Time",
                table: "Reservations");

            migrationBuilder.DropIndex(
                name: "IX_Reservations_TableId",
                table: "Reservations");

            migrationBuilder.DropIndex(
                name: "IX_Orders_TableId",
                table: "Orders");

            migrationBuilder.DropColumn(
                name: "CustomerPhoneCountryCode",
                table: "Reservations");

            migrationBuilder.DropColumn(
                name: "TableId",
                table: "Reservations");

            migrationBuilder.DropColumn(
                name: "TableId",
                table: "Orders");

            migrationBuilder.RenameColumn(
                name: "CustomerPhoneNumber",
                table: "Reservations",
                newName: "CustomerPhone");

            migrationBuilder.AddColumn<int>(
                name: "TableNumber",
                table: "Reservations",
                type: "int",
                nullable: true);

            migrationBuilder.AddColumn<int>(
                name: "TableNumber",
                table: "Orders",
                type: "int",
                nullable: true);
        }
    }
}
