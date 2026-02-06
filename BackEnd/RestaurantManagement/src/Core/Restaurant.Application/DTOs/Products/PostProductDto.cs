

using Microsoft.AspNetCore.Http;

namespace Restaurant.Application.DTOs
{
    public record PostProductDto
    (
        string Name,
        string Description,
        decimal Price,
        IFormFile? ImageFile,
        Guid CategoryId,
        bool IsAvailable
        );
    
}
