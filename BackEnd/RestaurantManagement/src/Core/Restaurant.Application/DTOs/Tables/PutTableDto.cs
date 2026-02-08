

namespace Restaurant.Application.DTOs
{
    public record PutTableDto
    (
        int TableNumber,
        int Capacity,
        bool IsAvailable
        );
    
}
