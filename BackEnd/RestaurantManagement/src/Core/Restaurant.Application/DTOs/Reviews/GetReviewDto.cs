

namespace Restaurant.Application.DTOs
{
    public record GetReviewDto
    (
        Guid Id,
        Guid UserId,
        Guid? OrderId,
        Guid? ProductId,
        string UserName,
        int Rating,
        string Comment,
        bool IsApproved,
        Guid? ApprovedBy,
        DateTime? ApprovedAt,
        DateTime CreatedAt
        );
    
}
