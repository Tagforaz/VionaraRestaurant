

namespace Restaurant.Application.DTOs
{
    public record PostCategoryDto
    (
        string Name,
        string? ImageUrl,
        int SortOrder,
        bool IsActive=true
        );
    
}
