

using Restaurant.Domain.Enums;
using Restaurant.Domain.ValueObjects;

namespace Restaurant.Domain.Entities
{
    public class Order : BaseAuditableEntity
    {
        public string OrderNumber { get; set; } = string.Empty;
        public Guid UserId { get; set; }
        public OrderStatus Status { get; set; } = OrderStatus.Pending;
        public DeliveryType Type { get; set; }

        public Money Subtotal { get; set; } = Money.Zero();
        public Money Total { get; set; } = Money.Zero();

        public string? OrderNotes { get; set; }
        public Address? DeliveryAddress { get; set; }
        public int? TableNumber { get; set; }

        public Guid? CouponId { get; set; }
        public decimal DiscountAmount { get; set; } = 0;
        public Coupon? Coupon { get; set; }

        public Guid? CourierId { get; set; }

        //Relational
        public User User { get; set; } = null!;
        public User? Courier { get; set; }
        public ICollection<OrderItem> Items { get; set; } = new List<OrderItem>();
    }

}
