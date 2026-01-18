

using Restaurant.Domain.Enums;

namespace Restaurant.Application.DTOs
{
    public record GetDeliveryTrackingDto
    (
        Guid Id,
        Guid OrderId,
        Guid CourierId,
        decimal Latitude,
        decimal Longitude,
        string? LocationAdress,
        string? Notes,
        OrderStatus Status,
        DateTime EstimatedDeliveryTime,
        DateTime CreatedAt
        );
    
}
