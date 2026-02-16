

using Restaurant.Application.DTOs;
using Restaurant.Domain.Enums;

namespace Restaurant.Application.Interfaces
{
    public interface INotificationService
    {
        Task SendOrderStatusNotificationAsync(
            Guid orderId,
            string orderNumber,
            OrderStatus status,
            OrderStatus? previousStatus,
            Guid userId,
            Guid? courierId = null,
            string? courierName = null);
        Task SendCourierAssignedNotificationAsync(
            CourierAssignedDto notification,
            Guid customerId,
            Guid courierId);

        Task SendNewOrderNotificationAsync(
            Guid orderId,
            string orderNumber,
            OrderStatus status);
    }
}
