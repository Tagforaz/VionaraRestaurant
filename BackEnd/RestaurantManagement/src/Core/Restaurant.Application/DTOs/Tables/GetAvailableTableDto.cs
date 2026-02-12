
namespace Restaurant.Application.DTOs
{
    public record GetAvailableTableDto
    (
        Guid Id,
        int TableNumber,
        int Capacity,
        bool IsBooked,
        decimal PositionX,
        decimal PositionY,
        int? Rotation
        );
    
}
