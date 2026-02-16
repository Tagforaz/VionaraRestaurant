using Microsoft.AspNetCore.Authorization;
using Microsoft.AspNetCore.SignalR;
using Restaurant.Application.Interfaces.Services;

namespace Restaurant.API.Hubs
{
    [Authorize]
    public class OrderStatusHub:Hub
    {
        private readonly IConnectionMappingService _connectionMapping;

        public OrderStatusHub(IConnectionMappingService connectionMapping)
        {
            _connectionMapping = connectionMapping;
        }
        public async Task SubscribeToOrder(Guid orderId)
        {
            await Groups.AddToGroupAsync(Context.ConnectionId, $"Order_{orderId}");
        }
        public async Task UnsubscribeFromOrder(Guid orderId)
        {
            await Groups.RemoveFromGroupAsync(Context.ConnectionId, $"Order_{orderId}");
        }

        [Authorize(Roles = "Admin")]
        public IEnumerable<Guid> GetOnlineCouriers()
        {
            return _connectionMapping.GetOnlineUsers();
        }
        public override async Task OnConnectedAsync()
        {
            var userId = Guid.Parse(Context.UserIdentifier!);
            var connectionId = Context.ConnectionId;

            _connectionMapping.Add(userId, connectionId);

            if (Context.User!.IsInRole("Admin"))
            {
                await Groups.AddToGroupAsync(connectionId, "Admins");
            }
            else if (Context.User.IsInRole("Courier"))
            {
                await Groups.AddToGroupAsync(connectionId, "Couriers");
            }
            else if (Context.User.IsInRole("Customer"))
            {
                await Groups.AddToGroupAsync(connectionId, "Customers");
            }

            await base.OnConnectedAsync();
        }

        public override async Task OnDisconnectedAsync(Exception? exception)
        {
            var userId = Guid.Parse(Context.UserIdentifier!);
            var connectionId = Context.ConnectionId;

            _connectionMapping.Remove(userId, connectionId);

            await base.OnDisconnectedAsync(exception);
        }
    }
}
