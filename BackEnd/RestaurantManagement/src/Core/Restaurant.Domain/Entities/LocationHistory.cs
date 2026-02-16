

namespace Restaurant.Domain.Entities
{
    public class LocationHistory : BaseEntity
    {
        public Guid CourierId { get; set; }
        public Guid? OrderId { get; set; }

        public decimal Latitude { get; set; }
        public decimal Longitude { get; set; }
        public DateTime Timestamp { get; set; }

        // Relational
        public User Courier { get; set; } = null!;
        public Order? Order { get; set; }
    }
}
