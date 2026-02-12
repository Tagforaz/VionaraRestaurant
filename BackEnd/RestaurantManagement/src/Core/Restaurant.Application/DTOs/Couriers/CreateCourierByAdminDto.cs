
using Microsoft.AspNetCore.Http;
using Restaurant.Domain.Enums;

namespace Restaurant.Application.DTOs
{
    public record CreateCourierByAdminDto
    (
        string FirstName,
        string LastName,
        string Email,
        string Password,
        string? PhoneNumber,
        VehicleType VehicleType,
        IFormFile? ImageFile
        );
    
}
