

using Restaurant.Application.DTOs;

namespace Restaurant.Application.Interfaces.Services
{
    public interface ITableService
    {
        Task<Guid> CreateAsync(PostTableDto tableDto);
        Task<GetTableDto?> GetByIdAsync(Guid id);
        Task<IReadOnlyList<GetTableDto>> GetAllAsync(int page, int take);
        Task<IReadOnlyList<GetAvailableTableDto>> GetAvailableTablesAsync(DateTime date, TimeSpan time, int partySize);
        Task UpdateAsync(Guid id, PutTableDto tableDto);
        Task DeleteAsync(Guid id);
    }
}
