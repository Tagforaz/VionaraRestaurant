

namespace Restaurant.Application.DTOs
{
    public record RegisterDto(
        string FirstName,
        string LastName,
        string Email,
        string Password,
        string ConfirmPassword,
        string? PhoneNumber,
        string? AvatarUrl
        );
    
}

