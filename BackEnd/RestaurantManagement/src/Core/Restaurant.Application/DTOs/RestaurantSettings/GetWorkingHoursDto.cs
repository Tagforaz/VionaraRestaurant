

namespace Restaurant.Application.DTOs
{
    public record GetWorkingHoursDto
    (
       DayOfWeek DayOfWeek,
       bool IsOpen,
       TimeOnly OpenTime,
       TimeOnly CloseTime
    );
}
