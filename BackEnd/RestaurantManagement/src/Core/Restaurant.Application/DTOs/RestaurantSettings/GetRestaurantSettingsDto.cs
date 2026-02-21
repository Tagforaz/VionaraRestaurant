
namespace Restaurant.Application.DTOs
{
    public record GetRestaurantSettingsDto
    (
         string Name,
         string Address,
         string Phone,
         string Email,
         List<GetWorkingHoursDto> WorkingHours
    );
}
