

using AutoMapper;
using Microsoft.EntityFrameworkCore;
using Restaurant.Application.DTOs;
using Restaurant.Application.Interfaces.Repositories;
using Restaurant.Application.Interfaces.Services;
using Restaurant.Domain.Entities;

namespace Restaurant.Persistence.Implementations.Services
{
    public class ProductService : IProductService
    {
        private readonly IProductRepository _repository;
        private readonly ICategoryRepository _categoryRepository;
        private readonly IMapper _mapper;

        public ProductService(IProductRepository repository, ICategoryRepository categoryRepository, IMapper mapper)
        {
            _repository = repository;
            _categoryRepository = categoryRepository;
            _mapper = mapper;
        }

        public async Task CreateAsync(PostProductDto productDto)
        {
            var categoryExists = await _categoryRepository.AnyAsync(c => c.Id == productDto.CategoryId && !c.IsDeleted && c.IsActive);
            if (!categoryExists)
                throw new Exception("Category not found or not active");

            var product = _mapper.Map<Product>(productDto);
            await _repository.AddAsync(product);
            await _repository.SaveChangesAsync();
        }

        public async Task DeleteAsync(Guid id)
        {
            var product = await _repository.GetByIdAsync(id);
            if (product == null) throw new Exception("Product not found");
            _repository.Delete(product);
            await _repository.SaveChangesAsync();
        }

        public async Task<IReadOnlyList<GetProductListItemDto>> GetAllAsync(int page, int take)
        {
            var products = await _repository.GetAll(
                filter: p => !p.IsDeleted,
                orderBy: p => p.CreatedAt,
                asNoTracking: true,
                page: page,
                take: take)
                .ToListAsync();

            return _mapper.Map<IReadOnlyList<GetProductListItemDto>>(products);
        }

        public async Task<GetProductDto?> GetByIdAsync(Guid id)
        {
            var product = await _repository.GetAll(
                filter: p => p.Id == id && !p.IsDeleted,
                asNoTracking: true)
                .Include(p => p.Category)
                .FirstOrDefaultAsync();

            if (product == null) return null;

            return _mapper.Map<GetProductDto>(product);
        }

        public async Task UpdateAsync(Guid id, PutProductDto productDto)
        {
            var product = await _repository.GetByIdAsync(id);
            if (product == null) throw new Exception("Product not found");

            var categoryExists = await _categoryRepository.AnyAsync(c => c.Id == productDto.CategoryId && !c.IsDeleted && c.IsActive);
            if (!categoryExists)
                throw new Exception("Category not found or not active");

            _mapper.Map(productDto, product);
            _repository.Update(product);
            await _repository.SaveChangesAsync();
        }

        public async Task SoftDeleteAsync(Guid id)
        {
            var product = await _repository.GetByIdAsync(id);
            if (product == null || product.IsDeleted)
                throw new Exception("Product not found");

            product.IsDeleted = true;
            product.DeletedAt = DateTime.UtcNow;
            _repository.Update(product);
            await _repository.SaveChangesAsync();
        }

    }
}
