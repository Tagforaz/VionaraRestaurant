

using Restaurant.Domain.Enums;

namespace Restaurant.Application.DTOs
{
    public record PostDeliveryTrackingDto
    (
        Guid OrderId,
        Guid CourierId,
        decimal Latitude,
        decimal Longitude,
        string? LocationAddress,
        string? Notes,
        OrderStatus Status,
        DateTime EstimatedDeliveryTime
        );
    
}
