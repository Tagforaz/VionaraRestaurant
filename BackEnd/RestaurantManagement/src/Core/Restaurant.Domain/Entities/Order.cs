

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

        public decimal Subtotal { get; set; } 
        public decimal Total { get; set; }

        public string? OrderNotes { get; set; }
        public Address? DeliveryAddress { get; set; }
       
        public Guid? TableId {  get; set; }

        public Guid? CouponId { get; set; }
        public decimal DiscountAmount { get; set; } = 0;
        
        public Guid? CourierId { get; set; }

        //Relational
        public Coupon? Coupon { get; set; }
        public Table? Table { get; set; }
        public User User { get; set; } = null!;
        public User? Courier { get; set; }
        public ICollection<OrderItem> Items { get; set; } = new List<OrderItem>();

        public void CalculateTotals()
        {
            Subtotal = Items.Sum(i => i.Price * i.Quantity);
            Total = Subtotal - DiscountAmount;
        }
        public void ApplyCouponDiscount(Coupon coupon)
        {
            if(coupon.DiscountType == DiscountType.FixedAmount)
            {
                DiscountAmount=coupon.DiscountValue;
            }
            else
            {
                DiscountAmount = Subtotal * (coupon.DiscountValue / 100);

                if (coupon.MaximumDiscountAmount.HasValue && DiscountAmount > coupon.MaximumDiscountAmount.Value)
                {
                    DiscountAmount = coupon.MaximumDiscountAmount.Value;
                }
            }
        }

        public static string GenerateOrderNumber()
        {
            return $"ORD-{DateTime.UtcNow:yyyyMMddHHmmss}-{Guid.NewGuid().ToString()[..6].ToUpper()}";
        }

        public void ValidateTableRequirement()
        {
            if (Type == DeliveryType.DineIn && !TableId.HasValue)
                throw new InvalidOperationException("DineIn orders must have a table assigned");
            if (Type != DeliveryType.DineIn && TableId.HasValue)
                throw new InvalidOperationException("Delivery/Takeout orders cannot have a table");
        }
    }


}
