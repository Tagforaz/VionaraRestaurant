

using Microsoft.AspNetCore.Http;

namespace Restaurant.Application.DTOs
{
    public record PutCategoryDto
    (
        string Name,
        IFormFile? ImageFile,
        int SortOrder,
        bool IsActive
        );

    
}
