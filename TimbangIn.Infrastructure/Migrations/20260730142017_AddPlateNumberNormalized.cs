using Microsoft.EntityFrameworkCore.Migrations;

#nullable disable

namespace TimbangIn.Infrastructure.Migrations
{
    /// <inheritdoc />
    public partial class AddPlateNumberNormalized : Migration
    {
        /// <inheritdoc />
        protected override void Up(MigrationBuilder migrationBuilder)
        {
            migrationBuilder.AddColumn<string>(
                name: "PlateNumberNormalized",
                table: "TruckMasters",
                type: "text",
                nullable: false,
                defaultValue: "");

            migrationBuilder.Sql("UPDATE \"TruckMasters\" SET \"PlateNumberNormalized\" = REPLACE(UPPER(\"PlateNumber\"), ' ', '');");

            migrationBuilder.CreateIndex(
                name: "IX_TruckMasters_PlateNumberNormalized",
                table: "TruckMasters",
                column: "PlateNumberNormalized",
                unique: true);
        }

        /// <inheritdoc />
        protected override void Down(MigrationBuilder migrationBuilder)
        {
            migrationBuilder.DropIndex(
                name: "IX_TruckMasters_PlateNumberNormalized",
                table: "TruckMasters");

            migrationBuilder.DropColumn(
                name: "PlateNumberNormalized",
                table: "TruckMasters");
        }
    }
}
