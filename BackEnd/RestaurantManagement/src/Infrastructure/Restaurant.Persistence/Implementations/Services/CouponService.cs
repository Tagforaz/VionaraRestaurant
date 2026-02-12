

using AutoMapper;
using Microsoft.EntityFrameworkCore;
using Restaurant.Application.DTOs;
using Restaurant.Application.Interfaces.Repositories;
using Restaurant.Application.Interfaces.Services;
using Restaurant.Domain.Entities;
using Restaurant.Application.Exceptions;

namespace Restaurant.Persistence.Implementations.Services
{
    public class CouponService : ICouponService
    {
        private readonly ICouponRepository _repository;
        private readonly IMapper _mapper;

        public CouponService(ICouponRepository repository, IMapper mapper)
        {
            _repository = repository;
            _mapper = mapper;
        }

        public async Task CreateAsync(PostCouponDto couponDto)
        {
            bool exists = await _repository.AnyAsync(c => c.Code == couponDto.Code && !c.IsDeleted);
            if (exists) throw new BusinessException($"Coupon code '{couponDto.Code}' already exists", "COUPON_CODE_EXISTS");

            var coupon = _mapper.Map<Coupon>(couponDto);
            await _repository.AddAsync(coupon);
            await _repository.SaveChangesAsync();
        }

        public async Task DeleteAsync(Guid id)
        {
            var coupon = await _repository.GetByIdAsync(id);
            if (coupon == null) throw new NotFoundException("Coupon",id);
            _repository.Delete(coupon);
            await _repository.SaveChangesAsync();
        }

        public async Task<IReadOnlyList<GetCouponItemDto>> GetAllAsync(int page, int take)
        {
            var coupons = await _repository.GetAll(
                filter: c => !c.IsDeleted,
                orderBy: c => c.ValidFrom,
                asNoTracking: true,
                page: page,
                take: take)
                .ToListAsync();

            return _mapper.Map<IReadOnlyList<GetCouponItemDto>>(coupons);
        }

        public async Task<GetCouponDto?> GetByIdAsync(Guid id)
        {
            var coupon = await _repository.GetByIdAsync(id);
            if (coupon == null || coupon.IsDeleted) return null;

            return _mapper.Map<GetCouponDto>(coupon);
        }

        public async Task SoftDeleteAsync(Guid id)
        {
            var coupon = await _repository.GetByIdAsync(id);
            if (coupon == null || coupon.IsDeleted)
                throw new NotFoundException("Coupon",id);

            coupon.IsDeleted = true;
            coupon.DeletedAt = DateTime.UtcNow;
            _repository.Update(coupon);
            await _repository.SaveChangesAsync();
        }

        public async Task UpdateAsync(Guid id, PutCouponDto couponDto)
        {
            var coupon = await _repository.GetByIdAsync(id);
            if (coupon == null || coupon.IsDeleted)
                throw new NotFoundException("Coupon", id);

            bool exists = await _repository.AnyAsync(c => c.Code == couponDto.Code && c.Id != id && !c.IsDeleted);
            if (exists)
                throw new BusinessException($"Coupon code '{couponDto.Code}' already exists", "COUPON_CODE_EXISTS");

            _mapper.Map(couponDto, coupon);
            _repository.Update(coupon);
            await _repository.SaveChangesAsync();
        }

        public async Task<IReadOnlyList<GetSoftDeletedCouponDto>> GetSoftDeletedAsync(int page, int take)
        {
            if (page < 1 || take < 1)
            {
                return new List<GetSoftDeletedCouponDto>();
            }

            var coupons = await _repository.GetAll(asNoTracking: true)
                .IgnoreQueryFilters()
                .Where(c => c.IsDeleted)
                .OrderByDescending(c => c.DeletedAt)
                .Skip((page - 1) * take)
                .Take(take)
                .ToListAsync();

            return _mapper.Map<IReadOnlyList<GetSoftDeletedCouponDto>>(coupons);
        }

        public async Task RestoreAsync(Guid id)
        {
            var coupon = await _repository.GetAll()
                .IgnoreQueryFilters()
                .FirstOrDefaultAsync(c => c.Id == id);

            if (coupon == null)
                throw new NotFoundException("Coupon", id);

            if (!coupon.IsDeleted)
                throw new BusinessException("Coupon is not deleted", "COUPON_NOT_DELETED");

            coupon.IsDeleted = false;
            coupon.DeletedAt = null;
            coupon.DeletedBy = null;

            _repository.Update(coupon);
            await _repository.SaveChangesAsync();
        }
    }
}
