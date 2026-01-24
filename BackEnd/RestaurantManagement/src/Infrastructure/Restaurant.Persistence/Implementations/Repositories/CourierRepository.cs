

using Restaurant.Application.Interfaces.Repositories;
using Restaurant.Domain.Entities;
using Restaurant.Persistence.Contexts;

namespace Restaurant.Persistence.Implementations.Repositories
{
    public class CourierRepository:Repository<Courier>,ICourierRepository
    {
        public CourierRepository(AppDbContext context) : base(context) { }
                      
    }
}
