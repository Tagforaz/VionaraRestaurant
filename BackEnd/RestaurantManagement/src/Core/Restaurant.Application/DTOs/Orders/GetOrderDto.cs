

using Restaurant.Domain.Enums;
using Restaurant.Domain.ValueObjects;

namespace Restaurant.Application.DTOs
{
    public record GetOrderDto
    (
        Guid Id,
        string OrderNumber,
        Guid UserId,
        Guid? CourierId,
        string CourierName,
        string UserEmail,
        Guid? TableId,
        OrderStatus Status,
        DeliveryType Type,
        int? TableNumber, 
        decimal Subtotal,
        decimal Total,
        decimal DiscountAmount,
        Guid? CouponId,
        string? OrderNotes,
        string? DeliveryAddress,
        DateTime CreatedAt,
        IReadOnlyList<GetOrderItemDto> Items

        );
    
}
