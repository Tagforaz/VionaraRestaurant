

using Restaurant.Domain.Enums;

namespace Restaurant.Application.DTOs
{
    public record PostCourierDto
    (
        Guid UserId,
        VehicleType VehicleType
        );
    
}
