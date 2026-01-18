

namespace Restaurant.Application.DTOs
{
    public record PostReservationDto
    (
        Guid UserId,
        DateTime Date,
        TimeSpan Time,
        int PartySize,
        string? SpecialRequests,
        int? TableNumber,
        string CustomerName,
        string CustomerEmail,
        string CustomerPhone
        );
    
}
