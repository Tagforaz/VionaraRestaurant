

using Restaurant.Domain.Enums;

namespace Restaurant.Application.DTOs
{
    public record PostCourierDto
    (
        string FirstName,
        string LastName,
        string Email,
        string PhoneNumber,
        string Password,
        VehicleType VehicleType
        );
    
}
