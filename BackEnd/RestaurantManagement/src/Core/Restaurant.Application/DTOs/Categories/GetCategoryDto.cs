

namespace Restaurant.Application.DTOs
{
    public record GetCategoryDto
    (
        Guid Id,
        string Name,
        string ImageUrl,
        int SortOrder,
        bool IsActive,
        DateTime CreatedAt
        );
    
}
