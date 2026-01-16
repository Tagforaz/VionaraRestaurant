

using Restaurant.Domain.Enums;

namespace Restaurant.Domain.Entities
{
    public class Courier:BaseAuditableEntity,ISoftDelete
    {
        public Guid UserId { get; set; }
        public VehicleType VehicleType { get; set; }
        public CourierStatus Status { get; set; }=CourierStatus.Available;
        public decimal AverageRating { get; set; } = 0;
        public int CompletedDeliveries { get; set; } = 0;
        public bool IsAvailable { get; set; } = true;

        //ISoftDelete
        public bool IsDeleted { get; set; }
        public DateTime? DeletedAt { get; set; }
        public string? DeletedBy { get; set; }

        //Relational
        public User User { get; set; } = null!;
        public ICollection<Order> Orders { get; set; } = new List<Order>();
        public ICollection<DeliveryTracking> DeliveryTracking { get; set;} = new List<DeliveryTracking>();

    }
}
