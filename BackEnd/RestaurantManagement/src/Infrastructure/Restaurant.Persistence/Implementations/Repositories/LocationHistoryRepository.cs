

using Microsoft.EntityFrameworkCore;
using Restaurant.Application.Interfaces.Repositories;
using Restaurant.Domain.Entities;
using Restaurant.Persistence.Contexts;

namespace Restaurant.Persistence.Implementations.Repositories
{
    public class LocationHistoryRepository : Repository<LocationHistory>, ILocationHistoryRepository
    {
        public LocationHistoryRepository(AppDbContext context) : base(context)
        {
        }

        public async Task<IEnumerable<LocationHistory>> GetCourierTrailAsync(Guid courierId, Guid orderId)
        {
            return await _context.LocationHistories
                .Where(lh => lh.CourierId == courierId && lh.OrderId == orderId)
                .OrderBy(lh => lh.Timestamp)
                .ToListAsync();
        }
    }
}
