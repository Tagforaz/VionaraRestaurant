

using Restaurant.Domain.Enums;

namespace Restaurant.Application.DTOs
{
    public record GetCourierDto
    (
        Guid Id,
        Guid UserId,
        string UserFullName,
        VehicleType VehicleType,
        CourierStatus Status,
        decimal AverageRating,
        int CompletedDeliveries,
        bool IsAvailable,
        DateTime CreatedAt
        );
    
}
