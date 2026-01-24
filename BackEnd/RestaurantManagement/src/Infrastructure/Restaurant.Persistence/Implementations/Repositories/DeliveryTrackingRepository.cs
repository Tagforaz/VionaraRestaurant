

using Restaurant.Application.Interfaces.Repositories;
using Restaurant.Domain.Entities;
using Restaurant.Persistence.Contexts;

namespace Restaurant.Persistence.Implementations.Repositories
{
    public class DeliveryTrackingRepository:Repository<DeliveryTracking>,IDeliveryTrackingRepository
    {
        public DeliveryTrackingRepository(AppDbContext context) : base(context) { }
        
            
        
    }
}
