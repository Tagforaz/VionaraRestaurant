

using Restaurant.Application.DTOs;

namespace Restaurant.Application.Interfaces.Services
{
    public interface IRestaurantSettingsService
    {
        Task<GetRestaurantSettingsDto> GetAsync();
        Task<GetRestaurantSettingsDto> UpdateAsync(PutRestaurantSettingsDto dto);
    }
}
