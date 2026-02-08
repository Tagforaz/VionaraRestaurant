

using Restaurant.Domain.Enums;
using Restaurant.Domain.ValueObjects;

namespace Restaurant.Domain.Entities
{
    public class Reservation:BaseAuditableEntity
    {
        public Guid UserId { get; set; }
        public Guid? TableId { get; set; }

        public DateTime Date {  get; set; }
        public TimeSpan Time { get; set; }
        public int PartySize { get; set; }
        public ReservationStatus Status { get; set; }=ReservationStatus.Pending;

        public string? SpecialRequests { get; set; }

        public string CustomerName { get; set; }=string.Empty;
        public string CustomerEmail { get; set; } = string.Empty;
        public PhoneNumber CustomerPhone { get; set; }=null!;

        //Relational
        public User User { get; set; } = null!;
        public Table? Table { get; set; }
    }
}
