
namespace Restaurant.Domain.Entities
{
    public class Table:BaseAuditableEntity
    {
        public int TableNumber { get; set; }
        public int Capacity { get; set; }
        public bool IsAvailable { get; set; } =true;

        //Relational
        public ICollection<Reservation> Reservations { get; set; } = new List<Reservation>();
        public ICollection<Order> Orders { get; set; } = new List<Order>();
    }
}
