

using Microsoft.EntityFrameworkCore;
using Restaurant.Application.DTOs;
using Restaurant.Application.Interfaces.Repositories;
using Restaurant.Application.Interfaces.Services;
using Restaurant.Domain.Entities;

namespace Restaurant.Persistence.Implementations.Services
{
    public class CategoryService:ICategoryService
    {
        private readonly ICategoryRepository _repository;

        public CategoryService(ICategoryRepository repository)
        {
            _repository = repository;
        }

        public async Task CreateAsync(PostCategoryDto categoryDto)
        {
            bool exists = await _repository.AnyAsync(c => c.Name == categoryDto.Name && !c.IsDeleted);
            if (exists)
            {
                throw new Exception($"Category name '{categoryDto.Name}' already exists");
            }
            var category = new Category
            {
                Name = categoryDto.Name,
                ImageUrl = categoryDto.ImageUrl,
                SortOrder = categoryDto.SortOrder,
                IsActive = categoryDto.IsActive
            };
            await _repository.AddAsync(category);
            await _repository.SaveChangesAsync();

        }

        public async Task DeleteAsync(Guid id)
        {
            var category = await _repository.GetByIdAsync(id);
            if (category == null) throw new Exception("Category not found");
            _repository.Delete(category);
            await _repository.SaveChangesAsync();
        }

        public async Task<IReadOnlyList<GetCategoryItemDto>> GetAllAsync(int page, int take)
        {
            var categories = await _repository.GetAll(
                filter: c=> !c.IsDeleted,
                orderBy: c=> c.SortOrder,
                asNoTracking:true,
                page:page,
                take:take
                ).Select(c=>new GetCategoryItemDto(
                    c.Id,
                    c.Name,
                    c.SortOrder,
                    c.IsActive))
                .ToListAsync();
            return categories;
                ;

        }

        public async Task<GetCategoryDto?> GetByIdAsync(Guid id)
        {
            var category = await _repository.GetByIdAsync(id);
            if (category == null ||  category.IsDeleted) return null;
            return new GetCategoryDto(
                category.Id,
                category.Name,
                category.ImageUrl,
                category.SortOrder,
                category.IsActive,
                category.CreatedAt
                );
        }

        public async Task SoftDeleteAsync(Guid id)
        {
            var category = await _repository.GetByIdAsync(id);
            if (category == null || category.IsDeleted)
                throw new Exception("Category not found");
            category.IsDeleted = true;
            category.DeletedAt= DateTime.UtcNow;
            _repository.Update(category);
            await _repository.SaveChangesAsync();
        }

        public async Task UpdateAsync(Guid id, PutCategoryDto categoryDto)
        {
            var category = await _repository.GetByIdAsync(id);
            if (category == null || category.IsDeleted) throw new Exception("Category not found");

            bool exists = await _repository.AnyAsync(c => c.Name == categoryDto.Name && c.Id != id && !c.IsDeleted);
            if (exists)
                throw new Exception($"Category name '{categoryDto.Name}' already exists"); 

            category.Name= categoryDto.Name;
            category.ImageUrl= categoryDto.ImageUrl;
            category.SortOrder= categoryDto.SortOrder;
            category.IsActive= categoryDto.IsActive;

            _repository.Update(category);
            await _repository.SaveChangesAsync();
        }
    }

}
