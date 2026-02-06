
namespace Restaurant.Application.DTOs
{
    public record GetCategoryItemDto
    (
        Guid Id,
        string Name,
        string? ImageUrl,
        int SortOrder,
        bool IsActive
     );
}
