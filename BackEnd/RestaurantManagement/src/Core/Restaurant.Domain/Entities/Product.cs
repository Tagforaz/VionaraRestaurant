

using Restaurant.Domain.ValueObjects;

namespace Restaurant.Domain.Entities
{
    public class Product : BaseAuditableEntity, ISoftDelete,IBaseAuditableEntity
    {
        //=string.Empty nullable kimidi amma ustunluyu check elemek lazim deyil
        public string Name { get; set; } = string.Empty;
        public string Description { get; set; } = string.Empty;
        public decimal Price { get; set; }
        public string? ImageUrl { get; set; }

        public Guid CategoryId { get; set; }
        public bool IsAvailable { get; set; } = true;

        public decimal AverageRating { get; set; }
        public int ReviewCount { get; set; }

        //ISoftDelete
        public bool IsDeleted { get; set; }
        public DateTime? DeletedAt { get; set; }
        public string? DeletedBy { get; set; }

        //Relational
        public Category Category { get; set; } = null!;
        public ICollection<OrderItem> OrderItems { get; set; } = new List<OrderItem>();
        public ICollection<Review> Reviews { get; set; } = new List<Review>();
    }
}
