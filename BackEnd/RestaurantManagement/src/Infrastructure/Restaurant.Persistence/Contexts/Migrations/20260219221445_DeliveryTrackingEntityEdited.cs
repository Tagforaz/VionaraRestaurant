using System;
using Microsoft.EntityFrameworkCore.Migrations;

#nullable disable

namespace Restaurant.Persistence.Contexts.Migrations
{
    /// <inheritdoc />
    public partial class DeliveryTrackingEntityEdited : Migration
    {
        /// <inheritdoc />
        protected override void Up(MigrationBuilder migrationBuilder)
        {
            migrationBuilder.DropForeignKey(
                name: "FK_DeliveryTrackings_AspNetUsers_CourierId",
                table: "DeliveryTrackings");

            migrationBuilder.AddColumn<Guid>(
                name: "CourierId1",
                table: "DeliveryTrackings",
                type: "uniqueidentifier",
                nullable: true);

            migrationBuilder.CreateIndex(
                name: "IX_DeliveryTrackings_CourierId1",
                table: "DeliveryTrackings",
                column: "CourierId1");

            migrationBuilder.AddForeignKey(
                name: "FK_DeliveryTrackings_Couriers_CourierId1",
                table: "DeliveryTrackings",
                column: "CourierId1",
                principalTable: "Couriers",
                principalColumn: "Id");
        }

        /// <inheritdoc />
        protected override void Down(MigrationBuilder migrationBuilder)
        {
            migrationBuilder.DropForeignKey(
                name: "FK_DeliveryTrackings_Couriers_CourierId1",
                table: "DeliveryTrackings");

            migrationBuilder.DropIndex(
                name: "IX_DeliveryTrackings_CourierId1",
                table: "DeliveryTrackings");

            migrationBuilder.DropColumn(
                name: "CourierId1",
                table: "DeliveryTrackings");

            migrationBuilder.AddForeignKey(
                name: "FK_DeliveryTrackings_AspNetUsers_CourierId",
                table: "DeliveryTrackings",
                column: "CourierId",
                principalTable: "AspNetUsers",
                principalColumn: "Id",
                onDelete: ReferentialAction.Restrict);
        }
    }
}
