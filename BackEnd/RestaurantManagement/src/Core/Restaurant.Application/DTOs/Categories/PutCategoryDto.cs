

namespace Restaurant.Application.DTOs
{
    public record PutCategoryDto
    (
        string Name,
        string? ImageUrl,
        int SortOrder,
        bool IsActive
        );

    
}
