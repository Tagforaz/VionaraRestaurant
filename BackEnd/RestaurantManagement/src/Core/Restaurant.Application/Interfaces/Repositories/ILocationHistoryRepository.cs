
using Restaurant.Domain.Entities;

namespace Restaurant.Application.Interfaces.Repositories
{
    public interface ILocationHistoryRepository:IRepository<LocationHistory>
    {
        Task<IEnumerable<LocationHistory>> GetCourierTrailAsync(Guid courierId, Guid orderId);
    }
}
