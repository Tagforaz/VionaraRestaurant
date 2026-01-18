

using Restaurant.Application.Interfaces.Repositories;
using Restaurant.Domain.Entities;
using Restaurant.Persistence.Contexts;

namespace Restaurant.Persistence.Implementations.Repositories
{
    public class CategoryRepository:Repository<Category>,ICategoryRepository
    {
        public CategoryRepository(AppDbContext context) :base(context) { }
        
            
        
    }
}
