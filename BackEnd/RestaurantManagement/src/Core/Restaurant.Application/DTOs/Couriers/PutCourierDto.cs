
using Microsoft.AspNetCore.Http;
using Restaurant.Domain.Enums;

namespace Restaurant.Application.DTOs
{
    public record PutCourierDto
    (
        VehicleType VehicleType,
        CourierStatus Status,
        bool IsAvailable,
        IFormFile? ImageFile
        );
    
}
