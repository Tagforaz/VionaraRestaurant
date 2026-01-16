

using Restaurant.Domain.Enums;

namespace Restaurant.Domain.Entities
{
    public class Reservation:BaseAuditableEntity
    {
        public Guid UserId { get; set; }
        public DateTime Date {  get; set; }
        public TimeSpan Time { get; set; }
        public int PartySize { get; set; }
        public ReservationStatus Status { get; set; }=ReservationStatus.Pending;

        public string? SpecialReuqests { get; set; }
        public int? TableNumber { get; set; }

        public string CustomerName { get; set; }=string.Empty;
        public string CustomerEmail { get; set; } = string.Empty;
        public string CustomerPhone { get; set; }=string.Empty;

        //Relational
        public User User { get; set; } = null!;
    }
}
