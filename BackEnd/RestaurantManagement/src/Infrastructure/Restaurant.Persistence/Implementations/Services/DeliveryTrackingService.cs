

using AutoMapper;
using Microsoft.EntityFrameworkCore;
using Restaurant.Application.DTOs;
using Restaurant.Application.Interfaces.Repositories;
using Restaurant.Application.Interfaces.Services;
using Restaurant.Domain.Entities;
using Restaurant.Application.Exceptions;

namespace Restaurant.Persistence.Implementations.Services
{
    public class DeliveryTrackingService : IDeliveryTrackingService
    {
        private readonly IDeliveryTrackingRepository _repository;
        private readonly IMapper _mapper;

        public DeliveryTrackingService(IDeliveryTrackingRepository repository, IMapper mapper)
        {
            _repository = repository;
            _mapper = mapper;
        }

        public async Task CreateAsync(PostDeliveryTrackingDto deliveryTrackingDto)
        {
            var entity = _mapper.Map<DeliveryTracking>(deliveryTrackingDto);
            await _repository.AddAsync(entity);
            await _repository.SaveChangesAsync();
        }

        public async Task DeleteAsync(Guid id)
        {
            var entity = await _repository.GetByIdAsync(id);
            if (entity == null) throw new NotFoundException("DeliveryTracking", id);
            _repository.Delete(entity);
            await _repository.SaveChangesAsync();
        }

        public async Task<IReadOnlyList<GetDeliveryTrackingDto>> GetAllAsync(int page, int take)
        {
            var entities = await _repository.GetAll(
                orderBy: x => x.CreatedAt,
                asNoTracking: true,
                page: page,
                take: take)
                .ToListAsync();

            return _mapper.Map<IReadOnlyList<GetDeliveryTrackingDto>>(entities);
        }

        public async Task<GetDeliveryTrackingDto?> GetByIdAsync(Guid id)
        {
            var entity = await _repository.GetByIdAsync(id);
            return entity == null ? null : _mapper.Map<GetDeliveryTrackingDto>(entity);
        }

        public async Task UpdateAsync(Guid id, PutDeliveryTrackingDto deliveryTrackingDto)
        {
            var entity = await _repository.GetByIdAsync(id);
            if (entity == null) throw new NotFoundException("DeliveryTracking",id);
            _mapper.Map(deliveryTrackingDto, entity);
            _repository.Update(entity);
            await _repository.SaveChangesAsync();
        }
    }
}
