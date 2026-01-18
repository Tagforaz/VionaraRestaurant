using Restaurant.Application.Interfaces.Repositories;
using Restaurant.Domain.Entities;
using Restaurant.Persistence.Contexts;



namespace Restaurant.Persistence.Implementations.Repositories
{
    public class ProductRepository:Repository<Product>,IProductRepository
    {
        public ProductRepository(AppDbContext context) : base(context) { }
    }
}
