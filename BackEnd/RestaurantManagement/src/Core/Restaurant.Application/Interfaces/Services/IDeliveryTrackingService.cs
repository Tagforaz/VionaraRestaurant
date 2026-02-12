

using Restaurant.Application.DTOs;

namespace Restaurant.Application.Interfaces.Services
{
    public interface IDeliveryTrackingService
    {
        Task<IReadOnlyList<GetDeliveryTrackingDto>> GetAllAsync(int page,int take);
        Task<GetDeliveryTrackingDto?> GetByIdAsync(Guid id);
        Task CreateAsync(PostDeliveryTrackingDto deliveryTrackingDto);
        Task UpdateAsync(Guid id, PutDeliveryTrackingDto deliveryTrackingDto);
        Task DeleteAsync(Guid id);
    }
}
