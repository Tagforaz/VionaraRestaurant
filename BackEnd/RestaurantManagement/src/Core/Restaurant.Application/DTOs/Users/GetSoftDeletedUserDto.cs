
using Restaurant.Domain.Enums;

namespace Restaurant.Application.DTOs
{
    public record GetSoftDeletedUserDto
    (
        Guid Id,
        string FullName,
        string Email,
        UserRole Role,
        DateTime? DeletedAt,
        string? DeletedBy
        );

}
