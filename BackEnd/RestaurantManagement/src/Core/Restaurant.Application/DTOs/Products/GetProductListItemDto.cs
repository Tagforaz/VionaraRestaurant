

namespace Restaurant.Application.DTOs
{
    public record GetProductListItemDto
    (
        Guid Id,
        string Name,
        decimal Price,
        bool IsAvailable
        );
    
}
