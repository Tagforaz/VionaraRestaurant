
namespace Restaurant.Application.DTOs
{
    public record GetCategoryItemDto
    (
        Guid Id,
        string Name,
        int SortOrder,
        bool IsActive
     );
}
