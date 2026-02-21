

namespace Restaurant.Application.DTOs
{
    public record PutRestaurantSettingsDto
    (
        string Name,
        string Address,
        string Phone,
        string Email,
        List<PutWorkingHoursDto> WorkingHours
    );
    
}
