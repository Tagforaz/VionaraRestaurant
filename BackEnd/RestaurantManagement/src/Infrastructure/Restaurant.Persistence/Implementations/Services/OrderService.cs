

using AutoMapper;
using Microsoft.EntityFrameworkCore;
using Restaurant.Application.DTOs;
using Restaurant.Application.Interfaces.Repositories;
using Restaurant.Application.Interfaces.Services;
using Restaurant.Domain.Entities;

namespace Restaurant.Persistence.Implementations.Services
{
    public class OrderService : IOrderService
    {
        private readonly IOrderRepository _repository;
        private readonly IProductRepository _productRepository;
        private readonly ICouponRepository _couponRepository;
        private readonly IMapper _mapper;

        public OrderService(IOrderRepository repository, IProductRepository productRepository, ICouponRepository couponRepository, IMapper mapper)
        {
            _repository = repository;
            _productRepository = productRepository;
            _couponRepository = couponRepository;
            _mapper = mapper;
        }

        public async Task CreateAsync(PostOrderDto orderDto)
        {
            var order = _mapper.Map<Order>(orderDto);
            order.OrderNumber = Order.GenerateOrderNumber();

            foreach (var itemDto in orderDto.Items)
            {
                var product = await _productRepository.GetByIdAsync(itemDto.ProductId);
                if (product == null || !product.IsAvailable)
                    throw new Exception("Product not found or not available");

                var orderItem = new OrderItem
                {
                    ProductId = product.Id,
                    ProductName = product.Name,
                    Price = product.Price,
                    Quantity = itemDto.Quantity
                };
                order.Items.Add(orderItem);
            }

            order.CalculateTotals();

            if (orderDto.CouponId.HasValue)
            {
                var coupon = await _couponRepository.GetByIdAsync(orderDto.CouponId.Value);

                if (coupon == null || !coupon.IsActive)
                    throw new Exception("Coupon not found or not active");

                if (coupon.ValidFrom > DateTime.UtcNow || coupon.ValidTo < DateTime.UtcNow)
                    throw new Exception("Coupon is not valid at this time");

                if (coupon.MinimumOrderAmount.HasValue && order.Subtotal < coupon.MinimumOrderAmount.Value)
                    throw new Exception($"Minimum order amount for this coupon is {coupon.MinimumOrderAmount.Value} AZN");

                if (coupon.UsageLimit.HasValue && coupon.UsageCount >= coupon.UsageLimit.Value)
                    throw new Exception("Coupon usage limit reached");

                order.ApplyCouponDiscount(coupon);

                coupon.UsageCount++;
                _couponRepository.Update(coupon);

            }
            order.CalculateTotals();

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

        public async Task<IReadOnlyList<GetOrderListItemDto>> GetAllAsync(int page, int take)
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
                asNoTracking: true)
                .Include(o => o.Items)
                .Include(o => o.User)
                .Include(o => o.Coupon)
                .Include(o => o.Courier)
                .FirstOrDefaultAsync();

            if (order == null) return null;

            return _mapper.Map<GetOrderDto>(order);
        }

        public async Task UpdateAsync(Guid id, PutOrderDto orderDto)
        {
            var order = await _repository.GetByIdAsync(id);
            if (order == null) throw new Exception("Order not found");

            _mapper.Map(orderDto, order);
            _repository.Update(order);
            await _repository.SaveChangesAsync();
        }
    }
}
