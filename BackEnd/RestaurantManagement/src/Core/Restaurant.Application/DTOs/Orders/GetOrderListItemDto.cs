

using Restaurant.Domain.Enums;

namespace Restaurant.Application.DTOs
{
    public record GetOrderListItemDto
    (
        Guid Id,
        string OrderNumber,
        string UserEmail,
        int? TableNumber,
        decimal Total,
        OrderStatus Status,
        DeliveryType DeliveryType,
        DateTime CreatedAt
        );
    
}
