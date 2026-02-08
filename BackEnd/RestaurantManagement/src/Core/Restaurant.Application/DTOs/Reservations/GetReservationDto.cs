

using Restaurant.Domain.Enums;

namespace Restaurant.Application.DTOs
{
    public record GetReservationDto
    (
        Guid Id,
        Guid UserId,
        Guid? TableId,
        int? TableNumber,
        DateTime Date,
        TimeSpan Time,
        int PartySize,
        ReservationStatus Status,
        string? SpecialRequests,
        string CustomerName,
        string CustomerEmail,
        string CustomerPhone,
        DateTime CreatedAt
        );
    
}
