using Microsoft.EntityFrameworkCore.Migrations;

#nullable disable

namespace CounterQuote.Api.Migrations
{
    /// <inheritdoc />
    public partial class AddDrawingAndQuoteTotal : Migration
    {
        /// <inheritdoc />
        protected override void Up(MigrationBuilder migrationBuilder)
        {
            migrationBuilder.AddColumn<string>(
                name: "Drawing",
                table: "Jobs",
                type: "TEXT",
                nullable: false,
                defaultValue: "");

            migrationBuilder.AddColumn<decimal>(
                name: "QuoteTotal",
                table: "Jobs",
                type: "TEXT",
                nullable: false,
                defaultValue: 0m);
        }

        /// <inheritdoc />
        protected override void Down(MigrationBuilder migrationBuilder)
        {
            migrationBuilder.DropColumn(
                name: "Drawing",
                table: "Jobs");

            migrationBuilder.DropColumn(
                name: "QuoteTotal",
                table: "Jobs");
        }
    }
}
