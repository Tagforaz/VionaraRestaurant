

namespace Restaurant.Application.DTOs
{
    public record GetProductDto
    (
        Guid Id,
        string Name,
        string Description,
        decimal Price,
        string? ImageUrl,
        Guid CategoryId,
        string CategoryName,
        bool IsAvailable,
        decimal AverageRating,
        int ReviewCount,
        DateTime CreatedAt
        );
    
}
