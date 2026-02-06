

using Microsoft.AspNetCore.Http;

namespace Restaurant.Application.DTOs
{
    public record PutProductDto
    (
        string Name,
        string Description,
        decimal Price,
        IFormFile? ImageFile,
        Guid CategoryId,
        bool IsAvailable
        );
    
}
