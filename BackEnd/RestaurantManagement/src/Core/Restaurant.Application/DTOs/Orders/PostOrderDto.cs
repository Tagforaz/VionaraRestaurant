

using Restaurant.Domain.Enums;
using Restaurant.Domain.ValueObjects;

namespace Restaurant.Application.DTOs
{
    public record PostOrderDto
    (
        Guid UserId,
        IReadOnlyList<PostOrderItemDto> Items,
        string? OrderNotes,
        Address? DeliveryAddress,
        int? TableNumber,
        Guid? CouponId,
        DeliveryType Type
        );
    
}
