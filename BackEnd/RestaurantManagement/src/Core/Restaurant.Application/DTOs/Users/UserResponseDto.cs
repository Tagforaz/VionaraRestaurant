using Restaurant.Domain.Enums;
using System;
using System.Collections.Generic;
using System.Linq;
using System.Text;
using System.Threading.Tasks;

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
