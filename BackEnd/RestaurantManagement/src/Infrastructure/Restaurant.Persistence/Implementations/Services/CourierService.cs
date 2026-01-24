

using AutoMapper;
using Microsoft.EntityFrameworkCore;
using Restaurant.Application.DTOs;
using Restaurant.Application.Interfaces.Repositories;
using Restaurant.Application.Interfaces.Services;
using Restaurant.Domain.Entities;

namespace Restaurant.Persistence.Implementations.Services
{
    public class CourierService:ICourierService
    {
        private readonly ICourierRepository _repository;
        private readonly IMapper _mapper;

        public CourierService(ICourierRepository repository,IMapper mapper)
        {
            _repository = repository;
            _mapper = mapper;
        }

        public async Task CreateAsync(PostCourierDto courierDto)
        {
            var courier = _mapper.Map<Courier>(courierDto);
            await _repository.AddAsync(courier);
            await _repository.SaveChangesAsync();
        }

        public async Task DeleteAsync(Guid id)
        {
            var courier = await _repository.GetByIdAsync(id);
            if (courier == null) throw new Exception("Courier not found");
            _repository.Delete(courier);
            await _repository.SaveChangesAsync();
        }

        public async Task<IReadOnlyList<GetCourierListItemDto>> GetAllAsync(int page,int take)
        {
            var couriers = await _repository.GetAll(
                filter: c => !c.IsDeleted,
                orderBy: c => c.CreatedAt,
                asNoTracking: true,
                page:page,
                take:take)
                .Include(c=>c.User).ToListAsync();

            return _mapper.Map<IReadOnlyList<GetCourierListItemDto>>(couriers);
        }

        public async Task<GetCourierDto?> GetByIdAsync(Guid id)
        {
            var courier = await _repository.GetAll(
                filter:c=>c.Id==id&&!c.IsDeleted,
                asNoTracking:true)
                .Include(c=>c.User).FirstOrDefaultAsync();  
            
            if(courier == null) return null;

            return _mapper.Map<GetCourierDto>(courier);
        }

        public async Task SoftDeleteAsync(Guid id)
        {
            var courier = await _repository.GetByIdAsync(id);
            if (courier == null || courier.IsDeleted)
                throw new Exception("Courier not found");

            courier.IsDeleted = true;
            courier.DeletedAt = DateTime.UtcNow;
            _repository.Update(courier);
            await _repository.SaveChangesAsync();           
        }

        public async Task UpdateAsync(Guid id,PutCourierDto courierDto)
        {
            var courier = await _repository.GetByIdAsync(id);
            if (courier == null || courier.IsDeleted)
                throw new Exception("Courier not found");

            _mapper.Map(courierDto, courier);
            _repository.Update(courier);
            await _repository.SaveChangesAsync();
        }
    }
}
