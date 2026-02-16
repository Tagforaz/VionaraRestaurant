
using Restaurant.Application.Interfaces.Services;
using System.Collections.Concurrent;

namespace Restaurant.Infrastructure.Implementations.Services
{
    public class ConnectionMappingService:IConnectionMappingService
    {
        private readonly ConcurrentDictionary<Guid, HashSet<string>> _userConnections = new();
        private readonly ConcurrentDictionary<string, Guid> _connectionUsers = new();
        private readonly object _lock = new();

        public void Add(Guid userId, string connectionId)
        {
            lock (_lock)
            {
                if (!_userConnections.TryGetValue(userId, out var connections))
                {
                    connections = new HashSet<string>();
                    _userConnections[userId] = connections;
                }
                connections.Add(connectionId);
                _connectionUsers[connectionId] = userId;
            }
        }

        public void Remove(Guid userId, string connectionId)
        {
            lock (_lock)
            {
                if (_userConnections.TryGetValue(userId, out var connections))
                {
                    connections.Remove(connectionId);
                    if (connections.Count == 0)
                    {
                        _userConnections.TryRemove(userId, out _);
                    }
                }
                _connectionUsers.TryRemove(connectionId, out _);
            }
        }
        public IEnumerable<string> GetConnections(Guid userId)
        {
            return _userConnections.TryGetValue(userId, out var connections)
                ? connections.ToList()
                : Enumerable.Empty<string>();
        }
        public Guid? GetUserId(string connectionId)
        {
            return _connectionUsers.TryGetValue(connectionId, out var userId)
                ? userId
                : null;
        }
        public bool IsOnline(Guid userId)
        {
            return _userConnections.ContainsKey(userId);
        }

        public IEnumerable<Guid> GetOnlineUsers()
        {
            return _userConnections.Keys.ToList();
        }
    }
}
