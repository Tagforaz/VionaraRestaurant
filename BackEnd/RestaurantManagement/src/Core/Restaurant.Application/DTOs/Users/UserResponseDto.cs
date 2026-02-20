using Restaurant.Domain.Enums;


namespace Restaurant.Application.DTOs
{
    public record UserResponseDto(
        Guid Id,
        string FirstName,
        string LastName,
        string FullName,
        string Email,
        string? PhoneNumber,      
        string? AvatarUrl,
        UserRole Role,
        bool IsActive,
        string? FullAddress,        
        DateTime? LastLoginAt,
        DateTime CreatedAt
    );
}
