

using Restaurant.Application.DTOs;

namespace Restaurant.Application.Interfaces.Services
{
    public interface ICouponService
    {
        Task<IReadOnlyList<GetCouponItemDto>> GetAllAsync(int page, int take);
        Task<GetCouponDto?> GetByIdAsync(Guid id);
        Task CreateAsync(PostCouponDto couponDto);
        Task UpdateAsync(Guid id,PutCouponDto couponDto);
        Task DeleteAsync(Guid id);
        Task SoftDeleteAsync(Guid id);
    }
}
