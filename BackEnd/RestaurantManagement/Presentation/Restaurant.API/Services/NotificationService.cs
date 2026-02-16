using Microsoft.AspNetCore.SignalR;
using Restaurant.API.Hubs;
using Restaurant.Application.DTOs;
using Restaurant.Application.Helpers;
using Restaurant.Application.Interfaces;
using Restaurant.Domain.Enums;

namespace Restaurant.API.Services
{
    public class NotificationService : INotificationService
    {
        private readonly IHubContext<OrderStatusHub> _orderStatusHub;
        private readonly IHubContext<CourierTrackingHub> _courierTrackingHub;

        public NotificationService(
            IHubContext<OrderStatusHub> orderStatusHub,
            IHubContext<CourierTrackingHub> courierTrackingHub)
        {
            _orderStatusHub = orderStatusHub;
            _courierTrackingHub = courierTrackingHub;
        }

        public async Task SendOrderStatusNotificationAsync(
            Guid orderId,
            string orderNumber,
            OrderStatus status,
            OrderStatus? previousStatus,
            Guid userId,
            Guid? courierId = null,
            string? courierName = null)
        {
            var notification = new OrderStatusUpdateDto(
                OrderId: orderId,
                OrderNumber: orderNumber,
                Status: status,
                PreviousStatus: previousStatus,
                Timestamp: DateTime.UtcNow,
                Message: OrderStatusMessageHelper.GetMessage(status, courierName),
                CourierId: courierId,
                CourierName: courierName
            );

            await _orderStatusHub.Clients.User(userId.ToString())
                .SendAsync("OrderStatusChanged", notification);

            if (courierId.HasValue)
            {
                await _orderStatusHub.Clients.User(courierId.ToString())
                    .SendAsync("OrderStatusChanged", notification);
            }

            await _orderStatusHub.Clients.Group("Admins")
                .SendAsync("OrderStatusChanged", notification);

            await _orderStatusHub.Clients.Group($"Order_{orderId}")
                .SendAsync("OrderStatusChanged", notification);
        }

        public async Task SendCourierAssignedNotificationAsync(
            CourierAssignedDto notification,
            Guid customerId,
            Guid courierId)
        {
            await _courierTrackingHub.Clients.User(customerId.ToString())
                .SendAsync("CourierAssigned", notification);

            await _courierTrackingHub.Clients.User(courierId.ToString())
                .SendAsync("OrderAssigned", notification);

            await _courierTrackingHub.Clients.Group("Admins")
                .SendAsync("CourierAssigned", notification);
        }

        public async Task SendNewOrderNotificationAsync(
            Guid orderId,
            string orderNumber,
            OrderStatus status)
        {
            var notification = new OrderStatusUpdateDto(
                OrderId: orderId,
                OrderNumber: orderNumber,
                Status: status,
                PreviousStatus: null,
                Timestamp: DateTime.UtcNow,
                Message: OrderStatusMessageHelper.GetMessage(status),
                CourierId: null,
                CourierName: null
            );

            await _orderStatusHub.Clients.Group("Admins")
                .SendAsync("NewOrderCreated", notification);
        }
    }
}