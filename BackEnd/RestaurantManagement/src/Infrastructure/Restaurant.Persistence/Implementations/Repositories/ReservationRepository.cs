using Restaurant.Application.Interfaces.Repositories;
using Restaurant.Domain.Entities;
using Restaurant.Persistence.Contexts;


namespace Restaurant.Persistence.Implementations.Repositories
{
    public class ReservationRepository:Repository<Reservation>,IReservationRepository
    {
        public ReservationRepository(AppDbContext context) : base(context) { }
        
            
        
    }
}
