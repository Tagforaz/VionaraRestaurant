

using Restaurant.Domain.Enums;

namespace Restaurant.Application.DTOs
{
    public record GetUserListDto
    (
        Guid Id,
        string FullName,
        string Email,
        UserRole Role,
        bool IsActive,
        DateTime CreatedAt,
        string? AvatarUrl,
        DateTime? LastLoginAt
        );
    
}
