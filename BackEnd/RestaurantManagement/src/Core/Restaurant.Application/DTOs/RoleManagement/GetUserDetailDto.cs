

using Restaurant.Domain.Enums;
using Restaurant.Domain.ValueObjects;

namespace Restaurant.Application.DTOs
{
    public record GetUserDetailDto
    (
        Guid Id,
        string FirstName,
        string LastName,
        string Email,
        UserRole Role,
        bool IsActive,
        string? PhoneNumber,
        Address? Address,
        string? AvatarUrl,
        DateTime CreatedAt,
        DateTime? LastLoginAt,
        bool EmailConfirmed,
        bool PhoneNumberConfirmed
        );
    
}
