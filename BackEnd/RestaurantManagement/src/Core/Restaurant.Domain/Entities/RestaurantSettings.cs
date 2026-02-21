
namespace Restaurant.Domain.Entities
{
    public class RestaurantSettings : BaseAuditableEntity
    {
        public string Name { get; set; } = string.Empty;
        public string Address { get; set; } = string.Empty;
        public string Phone { get; set; } = string.Empty;
        public string Email { get; set; } = string.Empty;
        public ICollection<WorkingHour> WorkingHours { get; set; } = new List<WorkingHour>();
    }
}
