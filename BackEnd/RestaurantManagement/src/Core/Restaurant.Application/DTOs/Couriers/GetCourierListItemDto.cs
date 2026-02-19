

using Restaurant.Domain.Enums;

namespace Restaurant.Application.DTOs
{
    public record GetCourierListItemDto
    (
        Guid Id,
        Guid UserId,
        string UserFullName,
        string? ImageUrl,
        CourierStatus Status,
        bool IsAvailable
        );
    
}
