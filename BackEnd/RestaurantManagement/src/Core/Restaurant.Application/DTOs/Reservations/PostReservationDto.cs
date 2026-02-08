

namespace Restaurant.Application.DTOs
{
    public record PostReservationDto
    (
        Guid UserId,
        Guid? TableId,
        DateTime Date,
        TimeSpan Time,
        int PartySize,
        string? SpecialRequests,
        string CustomerName,
        string CustomerEmail,
        string CustomerPhone
        );
    
}
