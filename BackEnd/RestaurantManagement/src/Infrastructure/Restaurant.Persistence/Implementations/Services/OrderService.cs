using AutoMapper;
using Microsoft.EntityFrameworkCore;
using Restaurant.Application.DTOs;
using Restaurant.Application.Exceptions;
using Restaurant.Application.Interfaces;
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
        private readonly INotificationService _notificationService;

        public OrderService(
            IOrderRepository repository,
            IProductRepository productRepository,
            ICouponRepository couponRepository,
            ITableRepository tableRepository,
            IMapper mapper,
            INotificationService notificationService)
        {
            _repository = repository;
            _productRepository = productRepository;
            _couponRepository = couponRepository;
            _tableRepository = tableRepository;
            _mapper = mapper;
            _notificationService = notificationService;
        }

        public async Task<GetOrderDto> CreateAsync(PostOrderDto orderDto)
        {
            if (orderDto.UserId == Guid.Empty)
                throw new ValidationException("UserId is required");

            if (orderDto.Items == null || !orderDto.Items.Any())
                throw new ValidationException("Order must have at least one item");

            if (!Enum.IsDefined(typeof(DeliveryType), orderDto.Type))
                throw new ValidationException("Wrong delivery type");

            Table? table = null;
            if (orderDto.Type == DeliveryType.DineIn)
            {
                if (!orderDto.TableId.HasValue)
                    throw new ValidationException("DineIn orders must have a table");

                table = await _tableRepository.GetByIdAsync(orderDto.TableId.Value);
                if (table == null)
                    throw new NotFoundException("Table", orderDto.TableId.Value);

                if (!table.IsAvailable)
                    throw new BusinessException("Table is not available", "TABLE_NOT_AVAILABLE");
            }
            else
            {
                if (orderDto.TableId.HasValue)
                    throw new ValidationException("Delivery/Takeout orders cannot have a table");
            }

            if (orderDto.Type == DeliveryType.Delivery)
            {
                if (string.IsNullOrWhiteSpace(orderDto.DeliveryAddress))
                    throw new ValidationException("Delivery address is required for delivery orders");
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
                    throw new ValidationException($"Quantity must be greater than 0 for product {itemDto.ProductId}");

                var product = await _productRepository.GetByIdAsync(itemDto.ProductId);

                if (product == null)
                    throw new NotFoundException("Product", itemDto.ProductId);

                if (!product.IsAvailable)
                    throw new BusinessException($"Product '{product.Name}' is not available", "PRODUCT_NOT_AVAILABLE");

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
                    throw new NotFoundException("Coupon", orderDto.CouponId.Value);

                if (coupon.ValidFrom > DateTime.UtcNow)
                    throw new BusinessException($"Coupon is valid from {coupon.ValidFrom:yyyy-MM-dd}", "COUPON_NOT_YET_VALID");

                if (coupon.ValidTo < DateTime.UtcNow)
                    throw new BusinessException("Coupon has expired", "COUPON_EXPIRED");

                if (coupon.MinimumOrderAmount.HasValue && order.Subtotal < coupon.MinimumOrderAmount.Value)
                    throw new BusinessException($"Minimum order amount for this coupon is {coupon.MinimumOrderAmount.Value} AZN", "COUPON_MINIMUM_AMOUNT");

                if (coupon.UsageLimit.HasValue && coupon.UsageCount >= coupon.UsageLimit.Value)
                    throw new BusinessException("Coupon usage limit reached", "COUPON_LIMIT_REACHED");

                order.CouponId = coupon.Id;
                order.ApplyCouponDiscount(coupon);

                coupon.UsageCount++;
                _couponRepository.Update(coupon);
            }

            order.CalculateTotals();

            const decimal minimumOrderAmount = 5m;
            if (order.Total < minimumOrderAmount)
                throw new BusinessException($"Minimum order amount is {minimumOrderAmount:F2} AZN", "MINIMUM_ORDER_AMOUNT");

            if (table != null)
            {
                table.IsAvailable = false;
                _tableRepository.Update(table);
            }

            await _repository.AddAsync(order);
            await _repository.SaveChangesAsync();

            await _notificationService.SendNewOrderNotificationAsync(
                order.Id,
                order.OrderNumber,
                order.Status
            );

            await _notificationService.SendOrderStatusNotificationAsync(
                order.Id,
                order.OrderNumber,
                order.Status,
                null,
                order.UserId
            );

            return _mapper.Map<GetOrderDto>(order);
        }

        public async Task DeleteAsync(Guid id)
        {
            var order = await _repository.GetByIdAsync(id);
            if (order == null)
                throw new NotFoundException("Order", id);

            if (order.Status != OrderStatus.Pending && order.Status != OrderStatus.Cancelled)
                throw new BusinessException("Only pending or cancelled orders can be deleted", "ORDER_CANNOT_BE_DELETED");

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
            if (order == null)
                throw new NotFoundException("Order", id);

            var oldStatus = order.Status;
            var oldCourierId = order.CourierId;

            if (orderDto.Status.HasValue)
            {
                ValidateStatusTransition(order.Status, orderDto.Status.Value);
            }

            _mapper.Map(orderDto, order);

            if (order.Status == OrderStatus.OutForDelivery && !order.PickedUpAt.HasValue)
            {
                order.PickedUpAt = DateTime.UtcNow;
            }

            if (order.Status == OrderStatus.Delivered && !order.DeliveredAt.HasValue)
            {
                order.DeliveredAt = DateTime.UtcNow;
            }

            if (orderDto.CourierId.HasValue && oldCourierId != orderDto.CourierId)
            {
                order.AssignedAt = DateTime.UtcNow;
            }

            if (order.TableId.HasValue && (order.Status == OrderStatus.Completed || order.Status == OrderStatus.Cancelled))
            {
                var table = await _tableRepository.GetByIdAsync(order.TableId.Value);
                if (table != null)
                {
                    table.IsAvailable = true;
                    _tableRepository.Update(table);
                }
            }

            _repository.Update(order);
            await _repository.SaveChangesAsync();
            await _notificationService.SendOrderStatusNotificationAsync(
                order.Id,
                order.OrderNumber,
                order.Status,
                oldStatus,
                order.UserId,
                order.CourierId,
                order.Courier?.UserName
            );

            if (orderDto.CourierId.HasValue && oldCourierId != orderDto.CourierId)
            {
                var notification = new CourierAssignedDto(
                    OrderId: order.Id,
                    OrderNumber: order.OrderNumber,
                    CourierId: order.CourierId.Value,
                    CourierName: order.Courier?.UserName ?? "Unknown",
                    CourierPhone: order.Courier?.PhoneNumber,
                    CourierImageUrl: null,
                    DeliveryAddress: order.DeliveryAddress?.ToString() ?? "N/A",
                    AssignedAt: order.AssignedAt ?? DateTime.UtcNow
                );

                await _notificationService.SendCourierAssignedNotificationAsync(
                    notification,
                    order.UserId,
                    order.CourierId.Value
                );
            }
        }

        private void ValidateStatusTransition(OrderStatus currentStatus, OrderStatus newStatus)
        {
            var allowedTransitions = new Dictionary<OrderStatus, List<OrderStatus>>
            {
                { OrderStatus.Pending, new List<OrderStatus> { OrderStatus.Confirmed, OrderStatus.Cancelled } },
                { OrderStatus.Confirmed, new List<OrderStatus> { OrderStatus.Preparing, OrderStatus.Cancelled } },
                { OrderStatus.Preparing, new List<OrderStatus> { OrderStatus.Ready, OrderStatus.Cancelled } },
                { OrderStatus.Ready, new List<OrderStatus> { OrderStatus.OutForDelivery, OrderStatus.Completed } },
                { OrderStatus.OutForDelivery, new List<OrderStatus> { OrderStatus.Delivered, OrderStatus.Failed } },
                { OrderStatus.Delivered, new List<OrderStatus> { OrderStatus.Completed } },
                { OrderStatus.Completed, new List<OrderStatus>() },
                { OrderStatus.Cancelled, new List<OrderStatus>() },
                { OrderStatus.Failed, new List<OrderStatus> { OrderStatus.Cancelled } }
            };

            if (currentStatus == newStatus)
                return;

            if (!allowedTransitions.ContainsKey(currentStatus))
                throw new BusinessException($"Invalid current status: {currentStatus}", "INVALID_STATUS");

            if (!allowedTransitions[currentStatus].Contains(newStatus))
                throw new BusinessException($"Cannot transition from {currentStatus} to {newStatus}", "INVALID_STATUS_TRANSITION");
        }
    }
}