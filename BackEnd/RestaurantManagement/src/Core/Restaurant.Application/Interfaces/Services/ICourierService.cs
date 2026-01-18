

using Restaurant.Application.DTOs;

namespace Restaurant.Application.Interfaces.Services
{
    public interface ICourierService
    {
        Task<IReadOnlyList<GetCourierListItemDto>> GetAllAsync(int page, int take);
        Task<GetCourierDto?> GetByIdAsync(Guid id);
        Task CreateAsync(PostCourierDto courierDto);
        Task UpdateAsync(Guid id, PutCourierDto courierDto);
        Task DeleteAsync(Guid id);
        Task SoftDeleteAsync(Guid id);
    }
}
