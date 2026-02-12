
namespace Restaurant.Application.DTOs
{
    public record GetTableDto
    (
        Guid Id,
        int TableNumber,
        int Capacity,
        bool IsAvailable,
        decimal PositionX,
        decimal PositionY,
        int? Rotation,
        DateTime CreatedAt
        );
    
}
