using Microsoft.EntityFrameworkCore.Migrations;

#nullable disable

namespace Restaurant.Persistence.Contexts.Migrations
{
    /// <inheritdoc />
    public partial class AllConfigurationEdited : Migration
    {
        /// <inheritdoc />
        protected override void Up(MigrationBuilder migrationBuilder)
        {
            migrationBuilder.DropIndex(
                name: "IX_Couriers_UserId",
                table: "Couriers");

            migrationBuilder.DropIndex(
                name: "IX_Coupons_Code",
                table: "Coupons");

            migrationBuilder.DropIndex(
                name: "IX_AspNetUsers_Email",
                table: "AspNetUsers");

            migrationBuilder.RenameIndex(
                name: "IX_Tables_TableNumber",
                table: "Tables",
                newName: "IX_Tables_TableNumber_Unique");

            migrationBuilder.RenameIndex(
                name: "IX_Categories_SortOrder_Unique",
                table: "Categories",
                newName: "Categories_SortOrder_Unique");

            migrationBuilder.AlterColumn<string>(
                name: "Name",
                table: "Categories",
                type: "nvarchar(50)",
                maxLength: 50,
                nullable: false,
                oldClrType: typeof(string),
                oldType: "nvarchar(450)");

            migrationBuilder.AlterColumn<string>(
                name: "PhoneNumber",
                table: "AspNetUsers",
                type: "nvarchar(450)",
                nullable: true,
                oldClrType: typeof(string),
                oldType: "nvarchar(max)",
                oldNullable: true);

            migrationBuilder.CreateIndex(
                name: "Couriers_UserId_Unique",
                table: "Couriers",
                column: "UserId",
                unique: true,
                filter: "[IsDeleted] = 0");

            migrationBuilder.CreateIndex(
                name: "IX_Couriers_IsAvailable",
                table: "Couriers",
                column: "IsAvailable");

            migrationBuilder.CreateIndex(
                name: "Coupons_Code_Unique",
                table: "Coupons",
                column: "Code",
                unique: true,
                filter: "[IsDeleted] = 0");

            migrationBuilder.CreateIndex(
                name: "IX_Coupons_ValidFrom",
                table: "Coupons",
                column: "ValidFrom");

            migrationBuilder.CreateIndex(
                name: "IX_Coupons_ValidTo",
                table: "Coupons",
                column: "ValidTo");

            migrationBuilder.CreateIndex(
                name: "IX_AspNetUsers_IsActive",
                table: "AspNetUsers",
                column: "IsActive");

            migrationBuilder.CreateIndex(
                name: "IX_AspNetUsers_Role",
                table: "AspNetUsers",
                column: "Role");

            migrationBuilder.CreateIndex(
                name: "Users_Email_Unique",
                table: "AspNetUsers",
                column: "Email",
                unique: true,
                filter: "[IsDeleted] = 0");

            migrationBuilder.CreateIndex(
                name: "Users_PhoneNumber_Unique",
                table: "AspNetUsers",
                column: "PhoneNumber",
                unique: true,
                filter: "[PhoneNumber] IS NOT NULL AND [IsDeleted] = 0");
        }

        /// <inheritdoc />
        protected override void Down(MigrationBuilder migrationBuilder)
        {
            migrationBuilder.DropIndex(
                name: "Couriers_UserId_Unique",
                table: "Couriers");

            migrationBuilder.DropIndex(
                name: "IX_Couriers_IsAvailable",
                table: "Couriers");

            migrationBuilder.DropIndex(
                name: "Coupons_Code_Unique",
                table: "Coupons");

            migrationBuilder.DropIndex(
                name: "IX_Coupons_ValidFrom",
                table: "Coupons");

            migrationBuilder.DropIndex(
                name: "IX_Coupons_ValidTo",
                table: "Coupons");

            migrationBuilder.DropIndex(
                name: "IX_AspNetUsers_IsActive",
                table: "AspNetUsers");

            migrationBuilder.DropIndex(
                name: "IX_AspNetUsers_Role",
                table: "AspNetUsers");

            migrationBuilder.DropIndex(
                name: "Users_Email_Unique",
                table: "AspNetUsers");

            migrationBuilder.DropIndex(
                name: "Users_PhoneNumber_Unique",
                table: "AspNetUsers");

            migrationBuilder.RenameIndex(
                name: "IX_Tables_TableNumber_Unique",
                table: "Tables",
                newName: "IX_Tables_TableNumber");

            migrationBuilder.RenameIndex(
                name: "Categories_SortOrder_Unique",
                table: "Categories",
                newName: "IX_Categories_SortOrder_Unique");

            migrationBuilder.AlterColumn<string>(
                name: "Name",
                table: "Categories",
                type: "nvarchar(450)",
                nullable: false,
                oldClrType: typeof(string),
                oldType: "nvarchar(50)",
                oldMaxLength: 50);

            migrationBuilder.AlterColumn<string>(
                name: "PhoneNumber",
                table: "AspNetUsers",
                type: "nvarchar(max)",
                nullable: true,
                oldClrType: typeof(string),
                oldType: "nvarchar(450)",
                oldNullable: true);

            migrationBuilder.CreateIndex(
                name: "IX_Couriers_UserId",
                table: "Couriers",
                column: "UserId",
                unique: true);

            migrationBuilder.CreateIndex(
                name: "IX_Coupons_Code",
                table: "Coupons",
                column: "Code",
                unique: true);

            migrationBuilder.CreateIndex(
                name: "IX_AspNetUsers_Email",
                table: "AspNetUsers",
                column: "Email",
                unique: true,
                filter: "[Email] IS NOT NULL");
        }
    }
}
