
using Restaurant.Domain.Enums;

namespace Restaurant.Application.Helpers
{
    public static class OrderStatusMessageHelper
    {
        public static string GetMessage(OrderStatus status, string? courierName = null)
        {
            return status switch
            {
                OrderStatus.Pending => "Your order has been received and is being processed",

                OrderStatus.Confirmed => "Your order has been confirmed and preparation has started",

                OrderStatus.Preparing => "Your order is being prepared",

                OrderStatus.Ready => "Your order is ready and waiting for delivery",

                OrderStatus.OutForDelivery => courierName != null
                    ? $"Courier {courierName} is delivering your order"
                    : "Order is out for delivery",

                OrderStatus.Delivered => "Order delivered. Enjoy your meal!",

                OrderStatus.Completed => "Order completed. Thank you!",

                OrderStatus.Cancelled => "Order cancelled",

                OrderStatus.Failed => "Delivery failed. Please contact support",

                _ => "Order status changed"
            };
        }
        public static string GetMessageAz(OrderStatus status, string? courierName = null)
        {
            return status switch
            {
                OrderStatus.Pending => "Your order has been received and is being processed",

                OrderStatus.Confirmed => "Your order has been confirmed and preparation has started",

                OrderStatus.Preparing => "Your order is being prepared",

                OrderStatus.Ready => "Your order is ready and waiting for delivery",

                OrderStatus.OutForDelivery => courierName != null
                    ? $"Courier {courierName} is delivering your order"
                    : "Order is out for delivery",

                OrderStatus.Delivered => "Order delivered. Enjoy your meal!",

                OrderStatus.Completed => "Order completed. Thank you!",

                OrderStatus.Cancelled => "Order cancelled",

                OrderStatus.Failed => "Delivery failed. Please contact support",

                _ => "Order status changed"
            };
        }

        public static string GetAdminMessage(OrderStatus status)
        {
            return status switch
            {
                OrderStatus.Pending => "New order awaiting confirmation",
                OrderStatus.Confirmed => "Order confirmed",
                OrderStatus.Preparing => "Order is being prepared",
                OrderStatus.Ready => "Order is ready - assign courier",
                OrderStatus.OutForDelivery => "Order is out for delivery",
                OrderStatus.Delivered => "Order delivered - awaiting completion",
                OrderStatus.Completed => "Order successfully completed",
                OrderStatus.Cancelled => "Order cancelled",
                OrderStatus.Failed => "Order failed - requires investigation",
                _ => "Status changed"
            };
        }
    }
}
