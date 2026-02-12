

namespace Restaurant.Application.DTOs
{
    public record PutTableDto
    {
        public int TableNumber { get; init; }
        public int Capacity { get; init; }
        public bool IsAvailable { get; init; }
        public decimal PositionX { get; init; }
        public decimal PositionY { get; init; }
        public int? Rotation { get; init; }
    }

}
