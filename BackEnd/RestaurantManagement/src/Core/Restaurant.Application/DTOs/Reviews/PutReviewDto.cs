

namespace Restaurant.Application.DTOs
{
    public record PutReviewDto
    (
        int Rating,
        string Comment,
        bool IsApproved
        );
    
}
