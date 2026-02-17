

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

        public CourierService(ICourierRepository repository, IMapper mapper, IFileService fileService)
        {
            _repository = repository;
            _mapper = mapper;
            _fileService = fileService;
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

        public async Task UpdateAsync(Guid id, PutCourierDto courierDto)
        {
            var courier = await _repository.GetByIdAsync(id);
            if (courier == null || courier.IsDeleted)
                throw new NotFoundException("Courier", id);

            if (courierDto.ImageFile != null)
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
    }
}
