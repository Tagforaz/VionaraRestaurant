

namespace Restaurant.Domain.Entities
{
    public class WorkingHour : BaseAuditableEntity
    {
        public Guid RestaurantSettingsId { get; set; }
        public DayOfWeek DayOfWeek { get; set; }
        public bool IsOpen { get; set; }
        public TimeOnly OpenTime { get; set; }
        public TimeOnly CloseTime { get; set; }
        public RestaurantSettings RestaurantSettings { get; set; } = null!;
    }
}
