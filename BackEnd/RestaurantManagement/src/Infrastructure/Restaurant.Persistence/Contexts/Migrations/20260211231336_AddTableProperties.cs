using Microsoft.EntityFrameworkCore.Migrations;

#nullable disable

namespace Restaurant.Persistence.Contexts.Migrations
{
    /// <inheritdoc />
    public partial class AddTableProperties : Migration
    {
        /// <inheritdoc />
        protected override void Up(MigrationBuilder migrationBuilder)
        {
            migrationBuilder.AddColumn<decimal>(
                name: "PositionX",
                table: "Table",
                type: "decimal(5,2)",
                nullable: false,
                defaultValue: 50.0m);

            migrationBuilder.AddColumn<decimal>(
                name: "PositionY",
                table: "Table",
                type: "decimal(5,2)",
                nullable: false,
                defaultValue: 50.0m);

            migrationBuilder.AddColumn<int>(
                name: "Rotation",
                table: "Table",
                type: "int",
                nullable: true,
                defaultValue: 0);

            migrationBuilder.CreateIndex(
                name: "IX_Table_PositionX_PositionY",
                table: "Table",
                columns: new[] { "PositionX", "PositionY" });
        }

        /// <inheritdoc />
        protected override void Down(MigrationBuilder migrationBuilder)
        {
            migrationBuilder.DropIndex(
                name: "IX_Table_PositionX_PositionY",
                table: "Table");

            migrationBuilder.DropColumn(
                name: "PositionX",
                table: "Table");

            migrationBuilder.DropColumn(
                name: "PositionY",
                table: "Table");

            migrationBuilder.DropColumn(
                name: "Rotation",
                table: "Table");
        }
    }
}
