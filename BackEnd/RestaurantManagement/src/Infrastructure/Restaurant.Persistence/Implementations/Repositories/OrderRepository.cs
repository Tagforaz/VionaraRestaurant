

using Restaurant.Application.Interfaces.Repositories;
using Restaurant.Domain.Entities;
using Restaurant.Persistence.Contexts;

namespace Restaurant.Persistence.Implementations.Repositories
{
    public class OrderRepository:Repository<Order>,IOrderRepository
    {
        public OrderRepository(AppDbContext context):base(context) { }
        
            
        
    }
}
