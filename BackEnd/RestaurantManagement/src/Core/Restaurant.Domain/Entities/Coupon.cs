

using Restaurant.Domain.Enums;

namespace Restaurant.Domain.Entities
{
    public class Coupon:BaseAuditableEntity,ISoftDelete
    {
        public string Code {get;set;}=string.Empty;
        public DiscountType DiscountType {get;set;}
        public decimal DiscountValue { get;set;}
        public decimal? MinimumOrderAmount {get;set;}
        public decimal? MaximumDiscountOrderAmount {get;set; }
        public DateTime ValidFrom {get;set;}
        public DateTime ValidTo {get;set;}
        public int? UsageLimit { get;set;}
        public int? UsageCount { get; set; } = 0;
        public bool IsActive { get; set; } = true;

        //ISoftDelete
        public bool IsDeleted { get; set; }
        public DateTime? DeletedAt { get; set; }
        public string? DeletedBy {  get; set; }

        //Relational
        public ICollection<Order> Orders { get; set; } = new List<Order>();
      
    }
}
