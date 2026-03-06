
using AutoMapper;
using Microsoft.EntityFrameworkCore;
using Restaurant.Application.DTOs;
using Restaurant.Application.Exceptions;
using Restaurant.Application.Interfaces.Repositories;
using Restaurant.Application.Interfaces.Services;
using Restaurant.Domain.Entities;
using Restaurant.Domain.Enums;
using Restaurant.Domain.ValueObjects;

namespace Restaurant.Persistence.Implementations.Services
{

    public class ReservationService : IReservationService
    {
        private readonly IReservationRepository _repository;
        private readonly ITableService _tableService;
        private readonly IMapper _mapper;
        private readonly IEmailService _emailService;

        public ReservationService(IReservationRepository repository, ITableService tableService, IMapper mapper, IEmailService emailService)
        {
            _repository = repository;
            _tableService = tableService;
            _mapper = mapper;
            _emailService = emailService;
        }

        public async Task CreateAsync(PostReservationDto reservationDto)
        {
            Guid? finalTableId = reservationDto.TableId;
            if (!finalTableId.HasValue)
            {
                var availableTables = await _tableService.GetAvailableTablesAsync(
                    reservationDto.Date,
                    reservationDto.Time,
                    reservationDto.PartySize);

                var freeTable = availableTables.FirstOrDefault(t => !t.IsBooked);

                if (freeTable == null)
                    throw new BusinessException("No available tables for the selected time", "NO_AVAILABLE_TABLES");

                finalTableId = freeTable.Id;
            }
            else
            {
                var isConflict = await CheckTableConflictAsync(
                    finalTableId.Value,
                    reservationDto.Date,
                    reservationDto.Time);

                if (isConflict)
                    throw new BusinessException("Selected table is already booked for this time", "TABLE_ALREADY_BOOKED");
            }
            var reservation = new Reservation
            {
                UserId = reservationDto.UserId,
                TableId = finalTableId,
                Date = reservationDto.Date,
                Time = reservationDto.Time,
                PartySize = reservationDto.PartySize,
                SpecialRequests = reservationDto.SpecialRequests,
                CustomerName = reservationDto.CustomerName,
                CustomerEmail = reservationDto.CustomerEmail,
                CustomerPhone = PhoneNumber.Create(reservationDto.CustomerPhone),
                Status = ReservationStatus.Pending
            };

            await _repository.AddAsync(reservation);
            await _repository.SaveChangesAsync();

        }

        private async Task<bool> CheckTableConflictAsync(Guid tableId, DateTime date, TimeSpan time)
        {
            var bufferHours = 2;
            var startTime = time.Subtract(TimeSpan.FromHours(bufferHours));
            var endTime = time.Add(TimeSpan.FromHours(bufferHours));

            return await _repository.GetAll(
                filter: r => r.TableId == tableId &&
                          r.Date == date.Date &&
                          r.Time >= startTime &&
                          r.Time <= endTime &&
                          r.Status != ReservationStatus.Cancelled)
                .AnyAsync();
        }
        public async Task DeleteAsync(Guid id)
        {
            var reservation = await _repository.GetByIdAsync(id);
            if (reservation == null) throw new NotFoundException("Reservation", id);
            _repository.Delete(reservation);
            await _repository.SaveChangesAsync();
        }

        public async Task<IReadOnlyList<GetReservationDto>> GetAllAsync(int page, int take)
        {
            var reservations = await _repository.GetAll(
                orderBy: r => r.CreatedAt,
                asNoTracking: true,
                page: page,
                take: take)
                .Include(r => r.Table)
                .ToListAsync();

            return reservations.Select(r => new GetReservationDto(
                r.Id,
                r.UserId,
                r.TableId,
                r.Table != null ? (int?)r.Table.TableNumber : null,
                r.Date,
                r.Time,
                r.PartySize,
                r.Status,
                r.SpecialRequests,
                r.CustomerName,
                r.CustomerEmail,
                r.CustomerPhone != null ? r.CustomerPhone.FullNumber : null,
                r.CreatedAt
            )).ToList();
        }

        public async Task<GetReservationDto?> GetByIdAsync(Guid id)
        {
            var reservation = await _repository.GetAll(
                filter: r => r.Id == id,
                asNoTracking: true)
                .Include(r => r.Table)
                .FirstOrDefaultAsync();

            if (reservation == null) return null;

            return new GetReservationDto(
                reservation.Id,
                reservation.UserId,
                reservation.TableId,
                reservation.Table != null ? (int?)reservation.Table.TableNumber : null,
                reservation.Date,
                reservation.Time,
                reservation.PartySize,
                reservation.Status,
                reservation.SpecialRequests,
                reservation.CustomerName,
                reservation.CustomerEmail,
                reservation.CustomerPhone != null ? reservation.CustomerPhone.FullNumber : null,
                reservation.CreatedAt
            );
        }

        public async Task UpdateAsync(Guid id, PutReservationDto reservationDto)
        {
            var reservation = await _repository.GetByIdAsync(id);
            if (reservation == null) throw new NotFoundException("Reservation", id);

            var oldStatus = reservation.Status;

            reservation.Date = reservationDto.Date;
            reservation.Time = reservationDto.Time;
            reservation.PartySize = reservationDto.PartySize;
            reservation.Status = reservationDto.Status;
            reservation.SpecialRequests = reservationDto.SpecialRequests;

            _repository.Update(reservation);
            await _repository.SaveChangesAsync();

            if (oldStatus != ReservationStatus.Confirmed &&
                reservationDto.Status == ReservationStatus.Confirmed)
            {
                await _emailService.SendReservationConfirmationAsync(
                    reservation.CustomerEmail,
                    reservation.CustomerName,
                    reservation.Date,
                    reservation.Time,
                    reservation.PartySize,
                    reservation.SpecialRequests
                );
            }
            if (oldStatus != ReservationStatus.Cancelled &&
               reservationDto.Status == ReservationStatus.Cancelled)
            {
                await _emailService.SendReservationCancelledAsync(
                    reservation.CustomerEmail,
                    reservation.CustomerName,
                    reservation.Date,
                    reservation.Time
                );
            }
        }
    }
}
