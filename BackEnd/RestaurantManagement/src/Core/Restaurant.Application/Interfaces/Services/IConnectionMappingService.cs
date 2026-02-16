

namespace Restaurant.Application.Interfaces.Services
{
    public interface IConnectionMappingService
    {
        void Add(Guid userId, string connectionId);
        void Remove(Guid userId, string connectionId);
        IEnumerable<string> GetConnections(Guid userId);
        Guid? GetUserId(string connectionId);
        bool IsOnline(Guid userId);
        IEnumerable<Guid> GetOnlineUsers();
    }
}
