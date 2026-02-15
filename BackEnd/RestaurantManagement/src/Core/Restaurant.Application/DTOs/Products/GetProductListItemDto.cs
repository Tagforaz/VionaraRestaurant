

namespace Restaurant.Application.DTOs
{
    public record GetProductListItemDto
    (
        Guid Id,
        string Name,
        string Description,
        decimal Price,
        string? ImageUrl,
        Guid CategoryId,
        string CategoryName,
        bool IsAvailable,
        DateTime CreatedAt
        );

}
