
namespace Restaurant.Application.DTOs
{
    public record GetSoftDeletedCategoryDto
    (
        Guid Id,
        string Name,
        string? ImageUrl,
        int SortOrder,
        DateTime? DeletedAt,
        string? DeletedBy
        );
    
}
