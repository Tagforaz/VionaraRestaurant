

namespace Restaurant.Application.DTOs
{
    public record PutProductDto
    (
        string Name,
        string Description,
        decimal Price,
        string? ImageUrl,
        Guid CategoryId,
        bool IsAvailable
        );
    
}
