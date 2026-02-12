

using AutoMapper;
using Microsoft.EntityFrameworkCore;
using Restaurant.Application.DTOs;
using Restaurant.Application.Interfaces.Repositories;
using Restaurant.Application.Interfaces.Services;
using Restaurant.Domain.Entities;
using Restaurant.Application.Exceptions;

namespace Restaurant.Persistence.Implementations.Services
{
    public class CourierService : ICourierService
    {
        private readonly ICourierRepository _repository;
        private readonly IMapper _mapper;
        private readonly IFileService _fileService;

        public CourierService(ICourierRepository repository, IMapper mapper,IFileService fileService)
        {
            _repository = repository;
            _mapper = mapper;
            _fileService = fileService;
        }

        public async Task CreateAsync(PostCourierDto courierDto)
        {
            var existingCourier = await _repository.GetAll(
                filter: c => c.UserId==courierDto.UserId&&!c.IsDeleted)
                .FirstOrDefaultAsync();

            if (existingCourier != null)
                throw new BusinessException("User already has a courier profile", "COURIER_ALREADY_EXISTS");

            var courier = _mapper.Map<Courier>(courierDto);
            courier.Status=Domain.Enums.CourierStatus.Available;
            courier.IsAvailable = true;
            courier.AverageRating = 0;
            courier.CompletedDeliveries = 0;

            if (courierDto.ImageFile != null)
            {
                courier.ImageUrl=await _fileService.UploadAsync(courierDto.ImageFile,"couriers");
            }

            await _repository.AddAsync(courier);
            await _repository.SaveChangesAsync();            
        }

        public async Task DeleteAsync(Guid id)
        {
            var courier = await _repository.GetByIdAsync(id);
            if (courier == null) throw new NotFoundException("Courier",id);

            if(!string.IsNullOrEmpty(courier.ImageUrl))
            {
                await _fileService.DeleteAsync(courier.ImageUrl);
            }

            _repository.Delete(courier);
            await _repository.SaveChangesAsync();
        }

        public async Task<IReadOnlyList<GetCourierListItemDto>> GetAllAsync(int page, int take)
        {
            var couriers = await _repository.GetAll(
                filter: c => !c.IsDeleted,
                orderBy: c => c.CreatedAt,
                asNoTracking: true,
                page: page,
                take: take)
                .Include(c => c.User)
                .ToListAsync();

            return _mapper.Map<IReadOnlyList<GetCourierListItemDto>>(couriers);
        }

        public async Task<GetCourierDto?> GetByIdAsync(Guid id)
        {
            var courier = await _repository.GetAll(
                filter: c => c.Id == id && !c.IsDeleted,
                asNoTracking: true)
                .Include(c => c.User)
                .FirstOrDefaultAsync();

            if (courier == null) return null;

            return _mapper.Map<GetCourierDto>(courier);
        }

        public async Task SoftDeleteAsync(Guid id)
        {
            var courier = await _repository.GetByIdAsync(id);
            if (courier == null )
                throw new NotFoundException("Courier",id);
            if (courier.IsDeleted)
                throw new BusinessException("Courier is already deleted", "COURIER_ALREADY_DELETED");

            courier.IsDeleted = true;
            courier.DeletedAt = DateTime.UtcNow;
            _repository.Update(courier);
            await _repository.SaveChangesAsync();
        }

        public async Task UpdateAsync(Guid id, PutCourierDto courierDto)
        {
            var courier = await _repository.GetByIdAsync(id);
            if (courier == null || courier.IsDeleted)
                throw new NotFoundException("Courier", id);

            if(courierDto.ImageFile != null)
            {
                if (!string.IsNullOrEmpty(courier.ImageUrl))
                {
                    await _fileService.DeleteAsync(courier.ImageUrl);
                }
                courier.ImageUrl = await _fileService.UploadAsync(courierDto.ImageFile, "couriers");
            }

            _mapper.Map(courierDto, courier);
            _repository.Update(courier);
            await _repository.SaveChangesAsync();
        }
        public async Task<IReadOnlyList<GetSoftDeletedCourierDto>> GetSoftDeletedAsync(int page, int take)
        {
            if (page < 1 || take < 1)
            {
                return new List<GetSoftDeletedCourierDto>();
            }

            var couriers = await _repository.GetAll(asNoTracking: true)
                .IgnoreQueryFilters()
                .Include(c => c.User)
                .Where(c => c.IsDeleted)
                .OrderByDescending(c => c.DeletedAt)
                .Skip((page - 1) * take)
                .Take(take)
                .ToListAsync();

            return _mapper.Map<IReadOnlyList<GetSoftDeletedCourierDto>>(couriers);
        }

        public async Task RestoreAsync(Guid id)
        {
            var courier = await _repository.GetAll()
                .IgnoreQueryFilters()
                .FirstOrDefaultAsync(c => c.Id == id);

            if (courier == null)
                throw new NotFoundException("Courier", id);

            if (!courier.IsDeleted)
                throw new BusinessException("Courier is not deleted", "COURIER_NOT_DELETED");

            courier.IsDeleted = false;
            courier.DeletedAt = null;
            courier.DeletedBy = null;

            _repository.Update(courier);
            await _repository.SaveChangesAsync();
        }
    }
}
