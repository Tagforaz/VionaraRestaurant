

using AutoMapper;
using Microsoft.EntityFrameworkCore;
using Restaurant.Application.DTOs;
using Restaurant.Application.Interfaces.Repositories;
using Restaurant.Application.Interfaces.Services;
using Restaurant.Domain.Entities;
using Restaurant.Domain.Enums;
using Restaurant.Domain.ValueObjects;

namespace Restaurant.Persistence.Implementations.Services
{
    public class OrderService : IOrderService
    {
        private readonly IOrderRepository _repository;
        private readonly IProductRepository _productRepository;
        private readonly ICouponRepository _couponRepository;
        private readonly ITableRepository _tableRepository;
        private readonly IMapper _mapper;

        public OrderService(IOrderRepository repository,
                            IProductRepository productRepository,
                            ICouponRepository couponRepository,
                            ITableRepository tableRepository,
                            IMapper mapper)
        {
            _repository = repository;
            _productRepository = productRepository;
            _couponRepository = couponRepository;
            _tableRepository = tableRepository;
            _mapper = mapper;
        }

        public async Task<Guid> CreateAsync(PostOrderDto orderDto)
        {
            if (orderDto.UserId == Guid.Empty)
                throw new ArgumentException("UserId is required");

            if (orderDto.Items == null || !orderDto.Items.Any())
                throw new ArgumentException("Order must have at least one item");

            if (!Enum.IsDefined(typeof(DeliveryType), orderDto.Type))
                throw new ArgumentException("Wrong delivery type");

            Table? table = null;
            if (orderDto.Type == DeliveryType.DineIn)
            {
                if (!orderDto.TableId.HasValue)
                    throw new ArgumentException("DineIn orders must have a table");

                table = await _tableRepository.GetByIdAsync(orderDto.TableId.Value);
                if (table == null)
                    throw new Exception("Table not found");

                if (!table.IsAvailable)
                {
                    throw new Exception("Table is not available");
                }
            }
            else
            {
                if (orderDto.TableId.HasValue)
                    throw new ArgumentException("Delivery/Takeout orders cannot  have a table");
            }

            if (orderDto.Type == DeliveryType.Delivery)
            {
                if (string.IsNullOrWhiteSpace(orderDto.DeliveryAddress))
                    throw new ArgumentException("Delivery address is required for delivery orders");
            }


            var order = _mapper.Map<Order>(orderDto);
            order.OrderNumber = Order.GenerateOrderNumber();
            order.Status = OrderStatus.Pending;

            if (orderDto.Type == DeliveryType.Delivery)
            {
                order.DeliveryAddress = Address.Create(orderDto.DeliveryAddress);
            }

            foreach (var itemDto in orderDto.Items)
            {
                if (itemDto.Quantity <= 0)
                    throw new ArgumentException($"Quantity must be greater than 0 for product {itemDto.ProductId}");

                var product = await _productRepository.GetByIdAsync(itemDto.ProductId);

                if (product == null)
                    throw new Exception($"Product {itemDto.ProductId} not found");

                if (!product.IsAvailable)
                    throw new Exception($"Product '{product.Name}' is not available");

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

                if (coupon.ValidFrom > DateTime.UtcNow)
                    throw new Exception($"Coupon is valid from {coupon.ValidFrom:yyyy-MM-dd}");

                if (coupon.ValidTo < DateTime.UtcNow)
                    throw new Exception("Coupon has expired");

                if (coupon.MinimumOrderAmount.HasValue && order.Subtotal < coupon.MinimumOrderAmount.Value)
                    throw new Exception($"Minimum order amount for this coupon is {coupon.MinimumOrderAmount.Value} AZN");

                if (coupon.UsageLimit.HasValue && coupon.UsageCount >= coupon.UsageLimit.Value)
                    throw new Exception("Coupon usage limit reached");

                order.CouponId = coupon.Id;
                order.ApplyCouponDiscount(coupon);

                coupon.UsageCount++;
                _couponRepository.Update(coupon);

            }
            order.CalculateTotals();

            const decimal minimumOrderAmount = 5m;
            if (order.Total < minimumOrderAmount)
                throw new ArgumentException($"Minimum order amount is {minimumOrderAmount:F2} AZN");

            if (table != null)
            {
                table.IsAvailable = false;
                _tableRepository.Update(table);
            }
            await _repository.AddAsync(order);
            await _repository.SaveChangesAsync();

            return order.Id;
        }

        public async Task DeleteAsync(Guid id)
        {
            var order = await _repository.GetByIdAsync(id);
            if (order == null)
                throw new Exception("Order not found");

            if (order.Status != OrderStatus.Pending && order.Status != OrderStatus.Cancelled)
                throw new InvalidOperationException("Only pending or cancelled orders can be deleted");

            if (order.TableId.HasValue)
            {
                var table = await _tableRepository.GetByIdAsync(order.TableId.Value);
                if (table != null && !table.IsAvailable)
                {
                    table.IsAvailable = true;
                    _tableRepository.Update(table);
                }
            }
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
                .Include(o => o.User)
                .Include(o => o.Table)
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
                .Include(o => o.Table)
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

            if (!Enum.IsDefined(typeof(OrderStatus), orderDto.Status))
                throw new ArgumentException("Invalid order status");

            ValidateStatusTransition(order.Status, orderDto.Status);

            if (orderDto.Status == OrderStatus.OutForDelivery || orderDto.Status == OrderStatus.Delivered)
            {
                if (!orderDto.CourierId.HasValue && order.Type == DeliveryType.Delivery)
                    throw new ArgumentException("Courier is required for delivery orders");
            }

            if (orderDto.Status == OrderStatus.Completed && order.TableId.HasValue)
            {
                var table = await _tableRepository.GetByIdAsync(order.TableId.Value);
                if (table != null)
                {
                    table.IsAvailable = true;
                    _tableRepository.Update(table);
                }
            }
            _mapper.Map(orderDto, order);
            _repository.Update(order);
            await _repository.SaveChangesAsync();
        }

        private void ValidateStatusTransition(OrderStatus currentStatus, OrderStatus newStatus)
        {
            var allowedTransitions = new Dictionary<OrderStatus, List<OrderStatus>>
            {
                { OrderStatus.Pending,new List<OrderStatus> { OrderStatus.Confirmed, OrderStatus.Cancelled } },
                { OrderStatus.Confirmed, new List<OrderStatus> { OrderStatus.Preparing, OrderStatus.Cancelled }},
                { OrderStatus.Preparing,new List<OrderStatus> { OrderStatus.Ready, OrderStatus.Cancelled }},
                {OrderStatus.Ready, new List<OrderStatus> {OrderStatus.OutForDelivery,OrderStatus.Completed} },
                {OrderStatus.OutForDelivery, new List<OrderStatus> {OrderStatus.Delivered,OrderStatus.Failed }},
                {OrderStatus.Delivered, new List<OrderStatus> {OrderStatus.Completed} },
                {OrderStatus.Completed, new List<OrderStatus>() },
                {OrderStatus.Cancelled, new List<OrderStatus>() },
                {OrderStatus.Failed, new List<OrderStatus> { OrderStatus.Cancelled} }
            };

            if (currentStatus == newStatus)
                return;

            if (!allowedTransitions.ContainsKey(currentStatus))
                 throw new InvalidOperationException($"Invalid current status:{currentStatus}");

            if (!allowedTransitions[currentStatus].Contains(newStatus))
                throw new InvalidOperationException($"Cannot transition from {currentStatus} to {newStatus}");

            


        }
    }
}
