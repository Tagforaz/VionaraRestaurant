

using AutoMapper;
using Microsoft.EntityFrameworkCore;
using Restaurant.Application.DTOs;
using Restaurant.Application.Interfaces.Repositories;
using Restaurant.Application.Interfaces.Services;
using Restaurant.Domain.Entities;
using Restaurant.Application.Exceptions;

namespace Restaurant.Persistence.Implementations.Services
{
    public class TableService:ITableService
    {
        private readonly ITableRepository _repository;
        private readonly IReservationRepository _reservationRepository;
        private readonly IMapper _mapper;

        public TableService(ITableRepository repository,IReservationRepository reservationRepository,IMapper mapper)
        {
            _repository = repository;
            _reservationRepository = reservationRepository;
            _mapper = mapper;
        }

        public async Task<Guid> CreateAsync(PostTableDto tableDto)
        {
            var existingTable = await _repository.GetAll(
                filter: t=>t.TableNumber == tableDto.TableNumber)
                .FirstOrDefaultAsync();
            if (existingTable != null)
                throw new BusinessException($"Table {tableDto.TableNumber} already exists", "TABLE_NUMBER_EXISTS");

            var table = _mapper.Map<Table>(tableDto);
            await _repository.AddAsync(table);
            await _repository.SaveChangesAsync();

            return table.Id;    
        }

        public async Task<GetTableDto?> GetByIdAsync(Guid id)
        {
            var table = await _repository.GetByIdAsync(id);
            return table == null ? null : _mapper.Map<GetTableDto>(table);
        }

        public async Task<IReadOnlyList<GetTableDto>> GetAllAsync(int page,int take)
        {
            var tables = await _repository.GetAll(
                orderBy: t => t.TableNumber,
                asNoTracking:true,
                page:page,
                take:take)
                .ToListAsync();

            return _mapper.Map<IReadOnlyList<GetTableDto>>(tables);
        }

        public async Task<IReadOnlyList<GetAvailableTableDto>> GetAvailableTablesAsync(DateTime date,TimeSpan time,int partySize)
        {
            var allTables = await _repository.GetAll(
                filter: t => t.IsAvailable && t.Capacity >= partySize,
                orderBy: t => t.Capacity,
                asNoTracking: true)
                .ToListAsync();

            var bufferHours = 2;
            var startTime = time.Subtract(TimeSpan.FromHours(bufferHours));
            var endTime = time.Add(TimeSpan.FromHours(bufferHours));

            var bookedTableIds = await _reservationRepository.GetAll(
                filter: r => r.Date == date.Date &&
                             r.Time >= startTime &&
                             r.Time <= endTime &&
                             r.Status != Domain.Enums.ReservationStatus.Cancelled,
                asNoTracking:true)
                .Select(r=>r.TableId)
                .Where(tableId => tableId.HasValue)
                .Select(tableId => tableId!.Value)
                .ToListAsync();

            var availableTables = allTables.Select(t => new GetAvailableTableDto(
                t.Id,
                t.Capacity,
                t.TableNumber,
                bookedTableIds.Contains(t.Id)))
                .ToList();
            return availableTables;
        }

        public async Task UpdateAsync(Guid id,PutTableDto tableDto)
        {
            var table = await _repository.GetByIdAsync(id);
            if (table == null)
                throw new NotFoundException("Table",id);

            if(table.TableNumber != tableDto.TableNumber)
            {
                var existingTable = await _repository.GetAll(
                    filter:t=>t.TableNumber == tableDto.TableNumber && t.Id!=id)
                    .FirstOrDefaultAsync();

                if (existingTable != null)
                    throw new BusinessException($"Table {tableDto.TableNumber} already exists", "TABLE_NUMBER_EXISTS");
            }

            _mapper.Map(tableDto, table);
            _repository.Update(table);
            await _repository.SaveChangesAsync();
        }

        public async Task DeleteAsync(Guid id)
        {
            var table = await _repository.GetByIdAsync(id);
            if (table == null) throw new NotFoundException("Table",id);

            _repository.Delete(table);
            await _repository.SaveChangesAsync();
        }
    }
}
