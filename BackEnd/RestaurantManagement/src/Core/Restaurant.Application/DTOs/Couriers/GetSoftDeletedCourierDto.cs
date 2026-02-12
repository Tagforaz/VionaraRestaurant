
using Restaurant.Domain.Enums;

namespace Restaurant.Application.DTOs
{
    public record GetSoftDeletedCourierDto
    (
         Guid Id,
        string UserFullName,
        string Email,
        VehicleType VehicleType,
        string? ImageUrl,
        DateTime? DeletedAt,
        string? DeletedBy
        );
    
}
