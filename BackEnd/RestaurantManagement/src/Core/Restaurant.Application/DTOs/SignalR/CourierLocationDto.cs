

namespace Restaurant.Application.DTOs
{
    public record CourierLocationDto
    (
        Guid CourierId,
        Guid? OrderId,
        decimal Latitude,
        decimal Longitude,
        DateTime Timestamp,
        string? CourierName
    );
}
