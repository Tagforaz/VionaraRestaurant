

using Restaurant.Domain.Enums;
using System.Reflection.Metadata;

namespace Restaurant.Application.DTOs
{
    public record GetCouponDto
    (
        Guid Id,
        string Code,
        DiscountType DiscountType,
        decimal DiscountValue,
        decimal? MinimumOrderAmount,
        decimal? MaximumDiscountAmount,
        DateTime ValidFrom,
        DateTime ValidTo,
        int? UsageLimit,
        int UsageCount,
        bool IsActive,
        DateTime CreatedAt

        );


}
