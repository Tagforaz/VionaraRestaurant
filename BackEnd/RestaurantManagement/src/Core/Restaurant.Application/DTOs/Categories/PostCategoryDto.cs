

using Microsoft.AspNetCore.Http;

namespace Restaurant.Application.DTOs
{
    public record PostCategoryDto
    (
        string Name,
        IFormFile? ImageFile,
        int SortOrder,
        bool IsActive=true
        );
    
}
