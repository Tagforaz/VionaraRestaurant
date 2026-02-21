

namespace Restaurant.Application.DTOs
{
    public record PutWorkingHoursDto
    (
        DayOfWeek DayOfWeek,
        bool IsOpen,
        TimeOnly OpenTime,
        TimeOnly CloseTime
    );
    
}
