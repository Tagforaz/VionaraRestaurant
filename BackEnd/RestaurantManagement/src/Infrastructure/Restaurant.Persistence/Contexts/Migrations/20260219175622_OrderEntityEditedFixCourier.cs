using System;
using Microsoft.EntityFrameworkCore.Migrations;

#nullable disable

namespace Restaurant.Persistence.Contexts.Migrations
{
    /// <inheritdoc />
    public partial class OrderEntityEditedFixCourier : Migration
    {
        /// <inheritdoc />
        protected override void Up(MigrationBuilder migrationBuilder)
        {
            migrationBuilder.DropForeignKey(
                name: "FK_Orders_AspNetUsers_CourierId",
                table: "Orders");

            migrationBuilder.AddColumn<Guid>(
                name: "CourierId1",
                table: "Orders",
                type: "uniqueidentifier",
                nullable: true);

            migrationBuilder.CreateIndex(
                name: "IX_Orders_CourierId1",
                table: "Orders",
                column: "CourierId1");

            migrationBuilder.AddForeignKey(
                name: "FK_Orders_Couriers_CourierId1",
                table: "Orders",
                column: "CourierId1",
                principalTable: "Couriers",
                principalColumn: "Id");
        }

        /// <inheritdoc />
        protected override void Down(MigrationBuilder migrationBuilder)
        {
            migrationBuilder.DropForeignKey(
                name: "FK_Orders_Couriers_CourierId1",
                table: "Orders");

            migrationBuilder.DropIndex(
                name: "IX_Orders_CourierId1",
                table: "Orders");

            migrationBuilder.DropColumn(
                name: "CourierId1",
                table: "Orders");

            migrationBuilder.AddForeignKey(
                name: "FK_Orders_AspNetUsers_CourierId",
                table: "Orders",
                column: "CourierId",
                principalTable: "AspNetUsers",
                principalColumn: "Id",
                onDelete: ReferentialAction.SetNull);
        }
    }
}
