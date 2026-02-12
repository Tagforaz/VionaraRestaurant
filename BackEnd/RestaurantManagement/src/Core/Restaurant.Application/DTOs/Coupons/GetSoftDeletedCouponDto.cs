
using Restaurant.Domain.Enums;

namespace Restaurant.Application.DTOs
{
    public record GetSoftDeletedCouponDto
    (
        Guid Id,
        string Code,
        DiscountType DiscountType,
        decimal DiscountValue,
        DateTime ValidFrom,
        DateTime ValidTo,
        DateTime? DeletedAt,
        string? DeletedBy
        );


}
