

using Restaurant.Application.Interfaces.Repositories;
using Restaurant.Domain.Entities;
using Restaurant.Persistence.Contexts;

namespace Restaurant.Persistence.Implementations.Repositories
{
    public class TableRepository: Repository<Table>, ITableRepository
    {
        public TableRepository(AppDbContext context) : base(context) { }
    }
    
    
}
