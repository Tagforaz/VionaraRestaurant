

namespace Restaurant.Application.DTOs
{
    public record PostReviewDto
    (
        Guid UserId,
        Guid? OrderId,
        Guid? ProductId,
        int Rating,
        string Comment
        );
    
}
