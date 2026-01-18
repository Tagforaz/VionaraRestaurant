

using Restaurant.Domain.Enums;

namespace Restaurant.Application.DTOs
{
    public record GetCouponItemDto
    (
        Guid Id,
        string Code,
        DiscountType DiscountType,
        decimal DiscountValue,
        bool IsActive
        );
    
}
