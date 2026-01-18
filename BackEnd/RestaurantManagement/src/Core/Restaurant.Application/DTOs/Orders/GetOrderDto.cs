

using Restaurant.Domain.Enums;
using Restaurant.Domain.ValueObjects;

namespace Restaurant.Application.DTOs
{
    public record GetOrderDto
    (
        Guid Id,
        string OrderNumber,
        Guid UserId,
        OrderStatus Status,
        DeliveryType Type,
        decimal Subtotal,
        decimal Total,
        decimal DiscountAmount,
        Guid? CouponId,
        Guid? CourierId,
        string? OrderNotes,
        Address? DeliveryAddress,
        int? TableNumber,
        DateTime CreatedAt,
        IReadOnlyList<GetOrderItemDto> Items

        );
    
}
