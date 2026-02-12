

using System.Security.Cryptography.X509Certificates;

namespace Restaurant.Application.DTOs
{
    public record PostTableDto
    {
        public int TableNumber { get; init; }
        public int Capacity { get; init; }
        public decimal PositionX { get; init; } = 50;
        public decimal PositionY { get; init; } = 50; 
        public int? Rotation { get; init; } = 0; 
    }

}
