

using AutoMapper;
using Microsoft.AspNetCore.Identity;
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
        private readonly UserManager<User> _userManager;
        private readonly IFileService _fileService;

        public CourierService(ICourierRepository repository, IMapper mapper,UserManager<User> userManager,IFileService fileService)
        {
            _repository = repository;
            _mapper = mapper;
            _userManager = userManager;
            _fileService = fileService;
        }

        public async Task CreateAsync(PostCourierDto courierDto)
        {
            var existingUser = await _userManager.FindByEmailAsync(courierDto.Email);
          
            if (existingUser != null)
                throw new BusinessException($"Email '{courierDto.Email}' is already registered", "EMAIL_ALREADY_EXISTS");
            var user = _mapper.Map<User>(courierDto);

            var result = await _userManager.CreateAsync(user, courierDto.Password);

            if (!result.Succeeded)
            {
                var errors = string.Join(",", result.Errors.Select(e=>e.Description));
                throw new ValidationException($"Failed to create user: {errors}");
            }

            await _userManager.AddToRoleAsync(user, "Courier");

            var courier = _mapper.Map<Courier>(courierDto);
            courier.UserId = user.Id;

            if(courierDto.ImageFile!=null)
            {
                courier.ImageUrl = await _fileService.UploadAsync(courierDto.ImageFile, "couriers");
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

            var  user = await _userManager.FindByIdAsync(courier.UserId.ToString());
            if(user != null)
            {
                await _userManager.DeleteAsync(user);
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
    }
}
