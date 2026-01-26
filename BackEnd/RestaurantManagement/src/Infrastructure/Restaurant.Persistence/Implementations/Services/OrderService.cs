

using AutoMapper;
using Microsoft.EntityFrameworkCore;
using Restaurant.Application.DTOs;
using Restaurant.Application.Interfaces.Repositories;
using Restaurant.Application.Interfaces.Services;
using Restaurant.Domain.Entities;

namespace Restaurant.Persistence.Implementations.Services
{
    public class OrderService:IOrderService
    {
        private readonly IOrderRepository _repository;
        private readonly IMapper _mapper;

        public OrderService(IOrderRepository repository,IMapper mapper)
        {
            _repository = repository;
            _mapper = mapper;
        }

        public async Task CreateAsync(PostOrderDto orderDto)
        {
            var order = _mapper.Map<Order>(orderDto);

            await _repository.AddAsync(order);
            await _repository.SaveChangesAsync();
        }

        public async Task DeleteAsync(Guid id)
        {
            var order = await _repository.GetByIdAsync(id);
            if (order == null) throw new Exception("Order not found");
            _repository.Delete(order);
            await _repository.SaveChangesAsync();
        }

        public async Task<IReadOnlyList<GetOrderListItemDto>> GetAllAsync(int page,int take)
        {
            var orders = await _repository.GetAll(
                orderBy: o => o.CreatedAt,
                asNoTracking: true,
                page: page,
                take: take)
                .ToListAsync();

            return _mapper.Map<IReadOnlyList<GetOrderListItemDto>>(orders);
        }

        public async Task<GetOrderDto?> GetByIdAsync(Guid id)
        {
            var order = await _repository.GetAll(
                filter: o => o.Id == id,
                asNoTracking:true)
                .Include(o=> o.Items)
                .FirstOrDefaultAsync();

            if(order == null) return null;

            return _mapper.Map<GetOrderDto>(order);
        }

        public async Task UpdateAsync(Guid id,PutOrderDto orderDto)
        {
            var order = await _repository.GetByIdAsync(id);
            if (order == null) throw new Exception("Order not found");

            _mapper.Map(orderDto,order);
            _repository.Update(order);
            await _repository.SaveChangesAsync();
        }
    }
}
