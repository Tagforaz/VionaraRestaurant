

using Microsoft.AspNetCore.Http;
using Restaurant.Domain.Enums;
using System.Security.Cryptography.X509Certificates;

namespace Restaurant.Application.DTOs
{
    public record PostCourierDto
    (
        Guid UserId,
        VehicleType VehicleType,
        IFormFile? ImageFile
        );
    
}
