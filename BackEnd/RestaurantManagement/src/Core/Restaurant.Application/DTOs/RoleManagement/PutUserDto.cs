

using Restaurant.Domain.Enums;

namespace Restaurant.Application.DTOs
{
    public   record UpdateUserDto
    (
        string FirstName,
        string LastName,
        string Email,
        string Password,
        UserRole Role,
        string? PhoneNumber,
        bool IsActive
    );
}
