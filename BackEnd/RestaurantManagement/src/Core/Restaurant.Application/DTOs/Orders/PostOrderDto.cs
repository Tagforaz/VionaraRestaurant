

using Restaurant.Domain.Enums;
using Restaurant.Domain.ValueObjects;

namespace Restaurant.Application.DTOs
{
    public record PostOrderDto
    (
        Guid UserId,
        Guid? TableId,
        IReadOnlyList<PostOrderItemDto> Items,
        string? OrderNotes,
        string? DeliveryAddress,
        int? TableNumber,
        Guid? CouponId,
        DeliveryType Type
        );
    
}
