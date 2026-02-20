

using Restaurant.Domain.Enums;

namespace Restaurant.Application.DTOs
{
    public record GetOrderListItemDto
    {
        public Guid Id { get; init; }
        public Guid? CourierId { get; init; }
        public string OrderNumber { get; init; } = string.Empty;
        public string UserEmail { get; init; } = string.Empty;
        public int? TableNumber { get; init; }
        public decimal Total { get; init; }
        public OrderStatus Status { get; init; }
        public DeliveryType DeliveryType { get; init; }
        public DateTime CreatedAt { get; init; }
    }

}
