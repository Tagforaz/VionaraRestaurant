

using Restaurant.Application.Interfaces.Repositories;
using Restaurant.Domain.Entities;
using Restaurant.Persistence.Contexts;

namespace Restaurant.Persistence.Implementations.Repositories
{
    public class CouponRepository:Repository<Coupon>,ICouponRepository
    {
        public CouponRepository(AppDbContext context):base(context) { }
        
            
        
    }
}
