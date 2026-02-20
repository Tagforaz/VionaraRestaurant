

using Restaurant.Application.DTOs;

namespace Restaurant.Application.Interfaces.Services
{
    public interface IOrderService
    {
        Task<IReadOnlyList<GetOrderListItemDto>> GetAllAsync(int page, int take, Guid? userId = null, Guid? courierId = null);
        Task<GetOrderDto> GetByIdAsync(Guid id);
        Task<GetOrderDto> CreateAsync(PostOrderDto orderDto);
        Task UpdateAsync(Guid id,PutOrderDto orderDto);
        Task DeleteAsync(Guid id);
    }
}
