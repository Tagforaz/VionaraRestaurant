
namespace Restaurant.Application.DTOs
{
    public record GetTableDto
    (
        Guid Id,
        int TableNumber,
        int Capacity,
        bool IsAvailable,
        DateTime CreatedAt
        );
    
}
