
using AutoMapper;
using Microsoft.EntityFrameworkCore;
using Restaurant.Application.DTOs;
using Restaurant.Application.Interfaces.Repositories;
using Restaurant.Application.Interfaces.Services;
using Restaurant.Domain.Entities;

namespace Restaurant.Persistence.Implementations.Services
{
    public class ReservationService : IReservationService
    {
        private readonly IReservationRepository _repository;
        private readonly IMapper _mapper;

        public ReservationService(IReservationRepository repository,IMapper mapper)
        {
            _repository = repository;
            _mapper = mapper;
        }

        public async Task CreateAsync(PostReservationDto reservationDto)
        {
            var reservation = _mapper.Map<Reservation>(reservationDto);
            await _repository.AddAsync(reservation);
            await _repository.SaveChangesAsync();
        }

        public async Task DeleteAsync(Guid id)
        {
            var reservation = await _repository.GetByIdAsync(id);
            if (reservation == null) throw new Exception("Reservation not found");
            _repository.Delete(reservation);
            await _repository.SaveChangesAsync();
        }

        public async Task<IReadOnlyList<GetReservationDto>> GetAllAsync(int page,int take)
        {
            var reservation = await _repository.GetAll(
                orderBy:r=>r.CreatedAt,
                asNoTracking:true,
                page:page,
                take:take)
                .ToListAsync();

            return _mapper.Map<IReadOnlyList<GetReservationDto>>(reservation);
        }

        public async Task<GetReservationDto?> GetByIdAsync(Guid id)
        {
            var reservation = await _repository.GetByIdAsync(id);
            return reservation == null ? null : _mapper.Map<GetReservationDto>(reservation);
        }

        public async Task UpdateAsync(Guid id,PutReservationDto reservationDto)
        {
            var reservation = await _repository.GetByIdAsync(id);
            if (reservation == null) throw new Exception("Reservation not found");

            _mapper.Map(reservationDto,reservation);
            _repository.Update(reservation);
            await _repository.SaveChangesAsync();
        }
    }
}
