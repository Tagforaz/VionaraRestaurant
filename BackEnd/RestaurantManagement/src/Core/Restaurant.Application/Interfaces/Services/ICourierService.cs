

using Restaurant.Application.DTOs;

namespace Restaurant.Application.Interfaces.Services
{
    public interface ICourierService
    {
        Task<IReadOnlyList<GetCourierListItemDto>> GetAllAsync(int page, int take);
        Task<GetCourierDto?> GetByIdAsync(Guid id);
        Task UpdateAsync(Guid id, PutCourierDto courierDto);
     

    }
}
