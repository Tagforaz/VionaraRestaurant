

using Restaurant.Domain.Enums;

namespace Restaurant.Application.DTOs
{
    public record GetReservationDto
    (
        Guid Id,
        Guid UserId,
        DateTime Date,
        TimeSpan Time,
        int PartySize,
        ReservationStatus Status,
        string? SpecialRequests,
        int? TableNumber,
        string CustomerName,
        string CustomerEmail,
        string CustomerPhone,
        DateTime CreatedAt
        );
    
}
