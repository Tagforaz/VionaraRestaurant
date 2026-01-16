

namespace Restaurant.Domain.Entities
{
    public class Review : BaseAuditableEntity
    {
        public Guid UserId { get; set; }
        public Guid? OrderId { get; set; }
        public Guid? ProductId { get; set; }

        public int Rating { get; set; }
        public string Comment { get; set; } = string.Empty;

        public bool IsApproved { get; set; }
        public Guid? ApprovedBy { get; set; }
        public DateTime? ApprovedAt { get; set; }

        //Relational
        public User User { get; set; } = null!;
        public Order? Order { get; set; }
        public Product? Product { get; set; }
    }
}
