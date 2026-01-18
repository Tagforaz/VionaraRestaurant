

namespace Restaurant.Application.DTOs
{
    public record PostProductDto
    (
        string Name,
        string Description,
        decimal Price,
        string? ImageUrl,
        Guid CategoryId,
        bool IsAvailable
        );
    
}
