

using Restaurant.Application.Interfaces.Repositories;
using Restaurant.Domain.Entities;
using Restaurant.Persistence.Contexts;

namespace Restaurant.Persistence.Implementations.Repositories
{
    public class ReviewRepository : Repository<Review>, IReviewRepository
    {
        public ReviewRepository(AppDbContext context) : base(context) { }


    }
}
