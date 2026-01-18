

using Restaurant.Domain.Enums;

namespace Restaurant.Application.DTOs
{
    public record PostCouponDto
    (
        string Code,
        DiscountType DiscountType,
        decimal DiscountValue,
        decimal? MinimumOrderAmount,
        decimal? MaximumDiscountAmount,
        DateTime ValidFrom,
        DateTime ValidTo,
        int? UsageLimit,
        bool IsActive=true
        );
    
}
