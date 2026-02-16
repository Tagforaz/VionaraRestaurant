using Microsoft.AspNetCore.Authorization;
using Microsoft.AspNetCore.SignalR;
using Microsoft.EntityFrameworkCore;
using Restaurant.Application.DTOs;
using Restaurant.Application.Interfaces.Repositories;
using Restaurant.Application.Interfaces.Services;
using Restaurant.Domain.Entities;

namespace Restaurant.API.Hubs
{
    [Authorize]
    public class CourierTrackingHub :Hub
    {
        private readonly IConnectionMappingService _connectionMapping;
        private readonly IOrderRepository _orderRepository;
        private readonly ILocationHistoryRepository _locationHistoryRepository;

        public CourierTrackingHub
        (
            IConnectionMappingService connectionMapping,
            IOrderRepository orderRepository,
            ILocationHistoryRepository locationHistoryRepository
        )
        {
            _connectionMapping = connectionMapping;
            _orderRepository = orderRepository;
            _locationHistoryRepository = locationHistoryRepository;
        }

        public async Task UpdateLocation(CourierLocationDto locationDto)
        {
            var userId = Guid.Parse(Context.UserIdentifier!);

            if (locationDto.CourierId != userId)
            {
                throw new HubException("Unauthorized: You can only update your own location");
            }
            var locationHistory = new LocationHistory
            {
                CourierId = locationDto.CourierId,
                OrderId = locationDto.OrderId,
                Latitude = locationDto.Latitude,
                Longitude = locationDto.Longitude,
                Timestamp = DateTime.UtcNow
            };

            await _locationHistoryRepository.AddAsync(locationHistory);
            await _locationHistoryRepository.SaveChangesAsync();

            if (locationDto.OrderId.HasValue)
            {
                var order = await _orderRepository.GetByIdAsync(locationDto.OrderId.Value);
                if (order != null)
                {
                    await Clients.User(order.UserId.ToString())
                        .SendAsync("CourierLocationUpdated", locationDto);
                }
            }
            await Clients.Group("Admins")
                .SendAsync("CourierLocationUpdated", locationDto);
        }
        public async Task TrackOrder(Guid orderId)
        {
            var userId = Guid.Parse(Context.UserIdentifier!);

            var order = await _orderRepository.GetByIdAsync(orderId);
            if (order == null)
            {
                throw new HubException("Order not found");
            }

            if (order.UserId != userId)
            {
                throw new HubException("Unauthorized: You can only track your own orders");
            }

            await Groups.AddToGroupAsync(Context.ConnectionId, $"Order_{orderId}");

            if (order.CourierId.HasValue)
            {
                var lastLocation = await _locationHistoryRepository
                    .GetAll(filter: lh => lh.CourierId == order.CourierId && lh.OrderId == orderId)
                    .OrderByDescending(lh => lh.Timestamp)
                    .FirstOrDefaultAsync();

                if (lastLocation != null)
                {
                    var locationDto = new CourierLocationDto(
                        CourierId: lastLocation.CourierId,
                        OrderId: lastLocation.OrderId,
                        Latitude: lastLocation.Latitude,
                        Longitude: lastLocation.Longitude,
                        Timestamp: lastLocation.Timestamp,
                        CourierName: order.Courier?.UserName
                    );

                    await Clients.Caller.SendAsync("CourierLocationUpdated", locationDto);
                }
            }
        }
        public async Task StopTrackingOrder(Guid orderId)
        {
            await Groups.RemoveFromGroupAsync(Context.ConnectionId, $"Order_{orderId}");
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
