

using AutoMapper;
using Microsoft.EntityFrameworkCore;
using Restaurant.Application.DTOs;
using Restaurant.Application.Interfaces.Repositories;
using Restaurant.Application.Interfaces.Services;
using Restaurant.Domain.Entities;
using Restaurant.Application.Exceptions;

namespace Restaurant.Persistence.Implementations.Services
{
    public class ProductService : IProductService
    {
        private readonly IProductRepository _repository;
        private readonly ICategoryRepository _categoryRepository;
        private readonly IMapper _mapper;
        private readonly IFileService _fileService;

        public ProductService(IProductRepository repository, ICategoryRepository categoryRepository, IMapper mapper,IFileService fileService)
        {
            _repository = repository;
            _categoryRepository = categoryRepository;
            _mapper = mapper;
            _fileService = fileService;
        }

        public async Task CreateAsync(PostProductDto productDto)
        {
            var categoryExists = await _categoryRepository.AnyAsync(c => c.Id == productDto.CategoryId && !c.IsDeleted && c.IsActive);
            if (!categoryExists)
                throw new NotFoundException("Category",productDto.CategoryId);

            var product = _mapper.Map<Product>(productDto);

            if(productDto.ImageFile != null)
            {
                product.ImageUrl=await _fileService.UploadAsync(productDto.ImageFile,"products");
            }
            await _repository.AddAsync(product);
            await _repository.SaveChangesAsync();
        }

        public async Task DeleteAsync(Guid id)
        {
            var product = await _repository.GetByIdAsync(id);
            if (product == null) throw new NotFoundException("Product",id);
            if(!string.IsNullOrEmpty(product.ImageUrl))
            {
                await _fileService.DeleteAsync(product.ImageUrl);
            }
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
                .Include(p=>p.Category)
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
            if (product == null) throw new NotFoundException("Product",id);

            var categoryExists = await _categoryRepository.AnyAsync(c => c.Id == productDto.CategoryId && !c.IsDeleted && c.IsActive);
            if (!categoryExists)
                throw new NotFoundException("Category",productDto.CategoryId);
            if(productDto.ImageFile != null)
            {
                if (!string.IsNullOrEmpty(product.ImageUrl))
                {
                    await _fileService.DeleteAsync(product.ImageUrl);
                }
                product.ImageUrl = await _fileService.UploadAsync(productDto.ImageFile, "products");
            }

            _mapper.Map(productDto, product);
            _repository.Update(product);
            await _repository.SaveChangesAsync();
        }

        public async Task SoftDeleteAsync(Guid id)
        {
            var product = await _repository.GetByIdAsync(id);
            if (product == null)
                throw new NotFoundException("Product", id);
            if (product.IsDeleted)
                throw new BusinessException("Product is already deleted","PRODUCT_ALREADY_DELETED");
            product.IsDeleted = true;
            product.DeletedAt = DateTime.UtcNow;
            _repository.Update(product);
            await _repository.SaveChangesAsync();
        }

        public async Task<IReadOnlyList<GetSoftDeletedProductDto>> GetSoftDeletedAsync(int page, int take)
        {
            if (page < 1 || take < 1)
            {
                return new List<GetSoftDeletedProductDto>();
            }

            var products = await _repository.GetAll(asNoTracking: true)
                .IgnoreQueryFilters()
                .Include(p => p.Category)
                .Where(p => p.IsDeleted)
                .OrderByDescending(p => p.DeletedAt)
                .Skip((page - 1) * take)
                .Take(take)
                .ToListAsync();

            return _mapper.Map<IReadOnlyList<GetSoftDeletedProductDto>>(products);
        }


        public async Task RestoreAsync(Guid id)
        {
            var product = await _repository.GetAll()
                .IgnoreQueryFilters()
                .FirstOrDefaultAsync(p => p.Id == id);

            if (product == null)
                throw new NotFoundException("Product", id);

            if (!product.IsDeleted)
                throw new BusinessException("Product is not deleted", "PRODUCT_NOT_DELETED");

            product.IsDeleted = false;
            product.DeletedAt = null;
            product.DeletedBy = null;

            _repository.Update(product);
            await _repository.SaveChangesAsync();
        }
    }
}
