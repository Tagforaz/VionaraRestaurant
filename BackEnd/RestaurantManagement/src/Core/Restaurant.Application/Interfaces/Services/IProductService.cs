
using Restaurant.Application.DTOs;

namespace Restaurant.Application.Interfaces.Services
{
    public interface IProductService
    {
        Task<IReadOnlyList<GetProductListItemDto>> GetAllAsync(int page, int Take);
        Task<GetProductDto?> GetByIdAsync(Guid id);
        Task CreateAsync(PostProductDto productDto);
        Task UpdateAsync(Guid id, PutProductDto productDto);
        Task DeleteAsync(Guid id);
        Task SoftDeleteAsync(Guid id);
    }
}
