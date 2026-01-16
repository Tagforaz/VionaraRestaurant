

using Restaurant.Domain.Enums;

namespace Restaurant.Domain.Entities
{
    public class DeliveryTracking : BaseAuditableEntity
    {
        public Guid OrderId { get; set; }
        public Guid CourierId { get; set; }
        public decimal Latitude { get; set; }
        public decimal Longitude { get; set; }
        public string? LocationAddress { get; set; }
        public string? Notes { get; set; }
        public OrderStatus Status { get; set; }
        public DateTime EstimatedDeliveryTime { get; set; }

        //relational 
        public Order Order { get; set; } = null!;
        public User Courier { get; set; } = null!;

    }
}
