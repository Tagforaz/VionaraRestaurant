

namespace Restaurant.Application.DTOs
{
    public record GetSoftDeletedProductDto
    (
        Guid Id,
        string Name,
        string Description,
        decimal Price,
        string? ImageUrl,
        string CategoryName,
        DateTime? DeletedAt,
        string? DeletedBy
        );
    
}
