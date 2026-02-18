

using Restaurant.Domain.Enums;

namespace Restaurant.Application.DTOs
{
    public record GetOrderDto
    {
        public Guid Id { get; init; }
        public string OrderNumber { get; init; } = string.Empty;
        public Guid UserId { get; init; }
        public Guid? CourierId { get; init; }
        public string CourierName { get; init; } = string.Empty;
        public string UserEmail { get; init; } = string.Empty;
        public Guid? TableId { get; init; }
        public OrderStatus Status { get; init; }
        public DeliveryType Type { get; init; }
        public int? TableNumber { get; init; }
        public decimal Subtotal { get; init; }
        public decimal Total { get; init; }
        public decimal DiscountAmount { get; init; }
        public Guid? CouponId { get; init; }
        public string? OrderNotes { get; init; }
        public string? DeliveryAddress { get; init; }
        public DateTime CreatedAt { get; init; }
        public IReadOnlyList<GetOrderItemDto> Items { get; init; } = [];

    };
    
}
