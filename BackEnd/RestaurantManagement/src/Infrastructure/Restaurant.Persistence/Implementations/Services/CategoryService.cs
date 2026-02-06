

using AutoMapper;
using Microsoft.EntityFrameworkCore;
using Restaurant.Application.DTOs;
using Restaurant.Application.Interfaces.Repositories;
using Restaurant.Application.Interfaces.Services;
using Restaurant.Domain.Entities;

namespace Restaurant.Persistence.Implementations.Services
{
    public class CategoryService : ICategoryService
    {
        private readonly ICategoryRepository _repository;
        private readonly IMapper _mapper;
        private readonly IFileService _fileService;

        public CategoryService(ICategoryRepository repository, IMapper mapper, IFileService fileService)
        {
            _repository = repository;
            _mapper = mapper;
            _fileService = fileService;
        }

        public async Task CreateAsync(PostCategoryDto categoryDto)
        {
            bool exists = await _repository.AnyAsync(c => c.Name == categoryDto.Name && !c.IsDeleted);
            if (exists)
            {
                throw new Exception($"Category name '{categoryDto.Name}' already exists");
            }
            bool sortOrderExists = await _repository.AnyAsync(c => c.SortOrder == categoryDto.SortOrder && !c.IsDeleted);
            if (sortOrderExists)
            {
                throw new Exception($"SortOrder {categoryDto.SortOrder} already exists. Please choose a different number");
            }
            var category = _mapper.Map<Category>(categoryDto);
            if (categoryDto.ImageFile != null)
            {
                category.ImageUrl = await _fileService.UploadAsync(categoryDto.ImageFile, "categories");
            }
            await _repository.AddAsync(category);
            await _repository.SaveChangesAsync();
        }

        public async Task DeleteAsync(Guid id)
        {
            var category = await _repository.GetByIdAsync(id);
            if (category == null) throw new Exception("Category not found");
            if (!string.IsNullOrEmpty(category.ImageUrl))
            {
                await _fileService.DeleteAsync(category.ImageUrl);
            }
            _repository.Delete(category);
            await _repository.SaveChangesAsync();
        }

        public async Task<IReadOnlyList<GetCategoryItemDto>> GetAllAsync(int page, int take)
        {

            if (page < 1 || take < 1)
            {
                return new List<GetCategoryItemDto>();
            }
            var categories = await _repository.GetAll(
                filter: c => !c.IsDeleted,
                orderBy: c => c.SortOrder,
                asNoTracking: true,
                page: page,
                take: take
                ).ToListAsync();

            return _mapper.Map<IReadOnlyList<GetCategoryItemDto>>(categories);
        }

        public async Task<GetCategoryDto?> GetByIdAsync(Guid id)
        {
            var category = await _repository.GetByIdAsync(id);
            if (category == null || category.IsDeleted) return null;

            return _mapper.Map<GetCategoryDto>(category);
        }

        public async Task SoftDeleteAsync(Guid id)
        {
            var category = await _repository.GetByIdAsync(id);
            if (category == null)
                throw new Exception("Category not found");
            if (category.IsDeleted)
                throw new Exception("Category is already deleted");
            category.IsDeleted = true;
            category.DeletedAt = DateTime.UtcNow;
            _repository.Update(category);
            await _repository.SaveChangesAsync();
        }

        public async Task UpdateAsync(Guid id, PutCategoryDto categoryDto)
        {
            var category = await _repository.GetByIdAsync(id);
            if (category == null || category.IsDeleted) throw new Exception("Category not found");

            bool nameExists = await _repository.AnyAsync(c => c.Name == categoryDto.Name && c.Id != id && !c.IsDeleted);
            if (nameExists)
                throw new Exception($"Category name '{categoryDto.Name}' already exists");

            bool sortOrderExists = await _repository.AnyAsync(c => c.SortOrder == categoryDto.SortOrder && c.Id != id && !c.IsDeleted);
            if (sortOrderExists)
                throw new Exception($"SortOrder {categoryDto.SortOrder} already exists. Please choose a different number.");

            bool exists = await _repository.AnyAsync(c => c.Name == categoryDto.Name && c.Id != id && !c.IsDeleted);
            if (exists)
                throw new Exception($"Category name '{categoryDto.Name}' already exists");

            if (categoryDto.ImageFile != null)
            {
                if (!string.IsNullOrEmpty(category.ImageUrl))
                {
                    await _fileService.DeleteAsync(category.ImageUrl);
                }
                category.ImageUrl = await _fileService.UploadAsync(categoryDto.ImageFile, "categories");

            }

            _mapper.Map(categoryDto, category);
            _repository.Update(category);
            await _repository.SaveChangesAsync();
        }
    }

}
