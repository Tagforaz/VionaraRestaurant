

namespace Restaurant.Domain.Entities
{
    public class Category : BaseAuditableEntity, ISoftDelete,IBaseAuditableEntity
    {
        public string Name { get; set; } = string.Empty;
        public string? ImageUrl { get; set; }
        public int SortOrder { get; set; }
        public bool IsActive { get; set; } = true;

        public bool IsDeleted { get; set; }
        public DateTime? DeletedAt { get; set; }
        public string? DeletedBy { get; set; }

        //Relational
        public ICollection<Product> Products { get; set; } = new List<Product>();
    }
}
