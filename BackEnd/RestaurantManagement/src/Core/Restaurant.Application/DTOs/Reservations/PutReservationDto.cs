

using Restaurant.Domain.Enums;

namespace Restaurant.Application.DTOs
{
    public record PutReservationDto
    (
        DateTime Date,
        TimeSpan Time,
        int PartySize,
        ReservationStatus Status,
        string? SpecialRequests
        );
    
}
