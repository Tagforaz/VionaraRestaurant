

namespace Restaurant.Domain.Entities
{
    public abstract class BaseAuditableEntity:BaseEntity
    {
        public DateTime CreatedAt { get; set; }
        public string? CreatedBy { get; set; }
        public DateTime? UpdatedAt { get; set; }
        public string? UpdatedBy { get;set; }
        protected BaseAuditableEntity() : base()
        {
            CreatedAt = DateTime.UtcNow;
        }
        protected BaseAuditableEntity(Guid id):base(id)
        {
            CreatedAt =DateTime.UtcNow;
        }

    }
}
