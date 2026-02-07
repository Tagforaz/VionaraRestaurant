
using Restaurant.Application.DTOs;


namespace Restaurant.Application.Interfaces.Services
{
    public interface ICategoryService
    {
        Task<IReadOnlyList<GetCategoryItemDto>> GetAllAsync(int page, int take);
        Task<GetCategoryDto?> GetByIdAsync(Guid id);
        Task CreateAsync(PostCategoryDto categoryDto);
        Task UpdateAsync(Guid id,PutCategoryDto categoryDto);
        Task DeleteAsync(Guid id);
        Task SoftDeleteAsync(Guid id);

        Task<IReadOnlyList<GetCategoryForDropdownDto>> GetCategoriesForDropdownAsync();
        
    }
}
