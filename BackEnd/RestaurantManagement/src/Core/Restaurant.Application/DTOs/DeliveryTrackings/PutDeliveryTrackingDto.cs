

using Restaurant.Domain.Enums;

namespace Restaurant.Application.DTOs
{
    public record PutDeliveryTrackingDto
    (
        decimal Latitude,
        decimal Longitude,
        string? LocationAddress,
        string? Notes,
        OrderStatus Status,
        DateTime EstimatedDeliveryTime
        );
        
           
    
}
