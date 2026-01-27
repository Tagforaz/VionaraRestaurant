
using Restaurant.Application.DTOs;

namespace Restaurant.Application.Interfaces.Services
{
    public interface IReservationService
    {
        Task CreateAsync(PostReservationDto reservationDto);
        Task DeleteAsync(Guid id);
        Task<IReadOnlyList<GetReservationDto>> GetAllAsync(int page, int take);
        Task<GetReservationDto?> GetByIdAsync(Guid id);
        Task UpdateAsync(Guid id, PutReservationDto reservationDto);
    }
}
