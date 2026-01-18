

using Restaurant.Application.DTOs;

namespace Restaurant.Application.Interfaces.Services
{
    public interface IReviewService
    {
        Task<IReadOnlyList<GetReviewDto>> GetAllAsync(int page, int take);
        Task<GetReviewDto?> GetByIdAsync(Guid id);
        Task CreateAsync (PostReviewDto reviewDto);
        Task UpdateAsync(Guid id, PutReviewDto reviewDto);
        Task DeleteAsync(Guid id);
    }
}
