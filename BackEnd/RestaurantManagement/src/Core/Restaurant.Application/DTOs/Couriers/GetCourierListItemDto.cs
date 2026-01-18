

using Restaurant.Domain.Enums;

namespace Restaurant.Application.DTOs
{
    public record GetCourierListItemDto
    (
        Guid Id,
        string UserFullName,
        CourierStatus Status,
        bool IsAvailable
        );
    
}
