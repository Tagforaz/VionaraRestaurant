

using Restaurant.Domain.Enums;

namespace Restaurant.Application.DTOs
{
    public record OrderStatusUpdateDto
    (
        Guid OrderId,
        string OrderNumber,
        OrderStatus Status,
        OrderStatus? PreviousStatus,
        DateTime Timestamp,
        string? Message,
        Guid? CourierId,
        string? CourierName
    );
}
