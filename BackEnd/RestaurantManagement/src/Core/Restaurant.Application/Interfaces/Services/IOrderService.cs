

using Restaurant.Application.DTOs;

namespace Restaurant.Application.Interfaces.Services
{
    public interface IOrderService
    {
        Task<IReadOnlyList<GetOrderListItemDto>> GetAllAsync(int page,int take);
        Task<GetOrderDto> GetByIdAsync(Guid id);
        Task CreateAsync(PostOrderDto orderDto);
        Task UpdateAsync(Guid id,PutOrderDto orderDto);
        Task DeleteAsync(Guid id);
    }
}
