

using Restaurant.Domain.Enums;

namespace Restaurant.Application.DTOs
{
    public record GetOrderListItemDto
    (
        Guid Id,
        string OrderNumber,
        decimal Total,
        OrderStatus Status,
        DateTime CreatedAt
        );
    
}
