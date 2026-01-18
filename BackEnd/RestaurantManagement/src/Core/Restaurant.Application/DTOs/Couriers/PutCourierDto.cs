
using Restaurant.Domain.Enums;

namespace Restaurant.Application.DTOs
{
    public record PutCourierDto
    (
        VehicleType VehicleType,
        CourierStatus Status,
        bool IsAvailable
        );
    
}
