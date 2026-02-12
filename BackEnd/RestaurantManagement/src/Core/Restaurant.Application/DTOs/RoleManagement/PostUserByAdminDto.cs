

using Restaurant.Domain.Enums;

namespace Restaurant.Application.DTOs
{
    public record  PostUserByAdminDto
    (
        string FirstName,
        string LastName,
        string Email,
        string Password,
        UserRole Role,
        string? PhoneNumber
        );
    
}
