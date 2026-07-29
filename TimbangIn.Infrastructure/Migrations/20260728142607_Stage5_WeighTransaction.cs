using System;
using Microsoft.EntityFrameworkCore.Migrations;

#nullable disable

namespace TimbangIn.Infrastructure.Migrations
{
    /// <inheritdoc />
    public partial class Stage5_WeighTransaction : Migration
    {
        /// <inheritdoc />
        protected override void Up(MigrationBuilder migrationBuilder)
        {
            migrationBuilder.CreateTable(
                name: "WeighTransactions",
                columns: table => new
                {
                    Id = table.Column<Guid>(type: "uuid", nullable: false),
                    TicketNumber = table.Column<string>(type: "text", nullable: false),
                    TruckId = table.Column<Guid>(type: "uuid", nullable: false),
                    CustomerId = table.Column<Guid>(type: "uuid", nullable: false),
                    MaterialTypeId = table.Column<Guid>(type: "uuid", nullable: false),
                    TransactionType = table.Column<int>(type: "integer", nullable: false),
                    Status = table.Column<int>(type: "integer", nullable: false),
                    WeighInKg = table.Column<decimal>(type: "numeric(18,2)", nullable: false),
                    WeighInTimestamp = table.Column<DateTime>(type: "timestamp with time zone", nullable: false),
                    WeighInOperatorId = table.Column<Guid>(type: "uuid", nullable: false),
                    WeighInPhotoPath = table.Column<string>(type: "text", nullable: false),
                    WeighOutKg = table.Column<decimal>(type: "numeric(18,2)", nullable: true),
                    WeighOutTimestamp = table.Column<DateTime>(type: "timestamp with time zone", nullable: true),
                    WeighOutOperatorId = table.Column<Guid>(type: "uuid", nullable: true),
                    WeighOutPhotoPath = table.Column<string>(type: "text", nullable: true),
                    NettoKg = table.Column<decimal>(type: "numeric(18,2)", nullable: true),
                    Notes = table.Column<string>(type: "text", nullable: true),
                    CreatedAt = table.Column<DateTime>(type: "timestamp with time zone", nullable: false),
                    UpdatedAt = table.Column<DateTime>(type: "timestamp with time zone", nullable: true),
                    IsDeleted = table.Column<bool>(type: "boolean", nullable: false)
                },
                constraints: table =>
                {
                    table.PrimaryKey("PK_WeighTransactions", x => x.Id);
                    table.ForeignKey(
                        name: "FK_WeighTransactions_Customers_CustomerId",
                        column: x => x.CustomerId,
                        principalTable: "Customers",
                        principalColumn: "Id",
                        onDelete: ReferentialAction.Cascade);
                    table.ForeignKey(
                        name: "FK_WeighTransactions_MaterialTypes_MaterialTypeId",
                        column: x => x.MaterialTypeId,
                        principalTable: "MaterialTypes",
                        principalColumn: "Id",
                        onDelete: ReferentialAction.Cascade);
                    table.ForeignKey(
                        name: "FK_WeighTransactions_TruckMasters_TruckId",
                        column: x => x.TruckId,
                        principalTable: "TruckMasters",
                        principalColumn: "Id",
                        onDelete: ReferentialAction.Cascade);
                });

            migrationBuilder.CreateIndex(
                name: "IX_WeighTransactions_CustomerId",
                table: "WeighTransactions",
                column: "CustomerId");

            migrationBuilder.CreateIndex(
                name: "IX_WeighTransactions_MaterialTypeId",
                table: "WeighTransactions",
                column: "MaterialTypeId");

            migrationBuilder.CreateIndex(
                name: "IX_WeighTransactions_TruckId",
                table: "WeighTransactions",
                column: "TruckId");
        }

        /// <inheritdoc />
        protected override void Down(MigrationBuilder migrationBuilder)
        {
            migrationBuilder.DropTable(
                name: "WeighTransactions");
        }
    }
}
