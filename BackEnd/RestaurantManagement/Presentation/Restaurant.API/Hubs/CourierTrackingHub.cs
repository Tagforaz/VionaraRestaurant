using Microsoft.AspNetCore.Authorization;
using Microsoft.AspNetCore.SignalR;
using Microsoft.EntityFrameworkCore;
using Restaurant.Application.DTOs;
using Restaurant.Application.Interfaces.Repositories;
using Restaurant.Application.Interfaces.Services;
using Restaurant.Domain.Entities;
using Restaurant.Domain.Enums;

namespace Restaurant.API.Hubs
{
    [Authorize]
    public class CourierTrackingHub : Hub
    {
        private readonly IConnectionMappingService _connectionMapping;
        private readonly IOrderRepository _orderRepository;
        private readonly ILocationHistoryRepository _locationHistoryRepository;
        private readonly ICourierRepository _courierRepository;

        public CourierTrackingHub(
            IConnectionMappingService connectionMapping,
            IOrderRepository orderRepository,
            ILocationHistoryRepository locationHistoryRepository,
            ICourierRepository courierRepository)
        {
            _connectionMapping = connectionMapping;
            _orderRepository = orderRepository;
            _locationHistoryRepository = locationHistoryRepository;
            _courierRepository = courierRepository;
        }

        public async Task UpdateLocation(CourierLocationDto locationDto)
        {
            var userId = Guid.Parse(Context.UserIdentifier!);
            var courier = await _courierRepository.GetAll(
                filter: c => c.Id == locationDto.CourierId,
                asNoTracking: true)
                .FirstOrDefaultAsync();

            if (courier == null || courier.UserId != userId)
                throw new HubException("Unauthorized: You can only update your own location");

            Order? order = null;
            if (locationDto.OrderId.HasValue)
            {
                order = await _orderRepository.GetByIdAsync(locationDto.OrderId.Value);

                if (order == null)
                    throw new HubException($"Order {locationDto.OrderId} does not exist");

                if (order.CourierId != locationDto.CourierId)
                    throw new HubException("You are not assigned to this order");

                var trackableStatuses = new[]
                {
                    OrderStatus.Confirmed, OrderStatus.Preparing,
                    OrderStatus.Ready, OrderStatus.OutForDelivery
                };

                if (!trackableStatuses.Contains(order.Status))
                    return;
            }
            try
            {
                var locationHistory = new LocationHistory
                {
                    CourierId = userId, 
                    OrderId = locationDto.OrderId,
                    Latitude = locationDto.Latitude,
                    Longitude = locationDto.Longitude,
                    Timestamp = DateTime.UtcNow
                };
                await _locationHistoryRepository.AddAsync(locationHistory);
                await _locationHistoryRepository.SaveChangesAsync();
            }
            catch (Exception ex)
            {
                Console.WriteLine($"[LocationHistory] DB xətası: {ex.Message}");
            }

            if (locationDto.OrderId.HasValue && order != null)
            {
                await Clients.User(order.UserId.ToString())
                    .SendAsync("CourierLocationUpdated", locationDto);
            }

            await Clients.Group("Admins")
                .SendAsync("CourierLocationUpdated", locationDto);
        }

        public async Task TrackOrder(Guid orderId)
        {
            var userId = Guid.Parse(Context.UserIdentifier!);

            var order = await _orderRepository.GetByIdAsync(orderId);
            if (order == null) throw new HubException("Order not found");
            if (order.UserId != userId) throw new HubException("Unauthorized");

            await Groups.AddToGroupAsync(Context.ConnectionId, $"Order_{orderId}");

            if (order.CourierId.HasValue)
            {
                var courierForHistory = await _courierRepository.GetAll(
                    filter: c => c.Id == order.CourierId,
                    asNoTracking: true)
                    .FirstOrDefaultAsync();

                if (courierForHistory != null)
                {
                    var lastLocation = await _locationHistoryRepository
                        .GetAll(filter: lh => lh.CourierId == courierForHistory.UserId
                                           && lh.OrderId == orderId)
                        .OrderByDescending(lh => lh.Timestamp)
                        .FirstOrDefaultAsync();

                    if (lastLocation != null)
                    {
                        var locationDto = new CourierLocationDto(
                            CourierId: order.CourierId.Value, 
                            OrderId: lastLocation.OrderId,
                            Latitude: lastLocation.Latitude,
                            Longitude: lastLocation.Longitude,
                            Timestamp: lastLocation.Timestamp,
                            CourierName: order.Courier?.User?.UserName
                        );
                        await Clients.Caller.SendAsync("CourierLocationUpdated", locationDto);
                    }
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
            _connectionMapping.Add(userId, Context.ConnectionId);

            if (Context.User!.IsInRole("Admin"))
                await Groups.AddToGroupAsync(Context.ConnectionId, "Admins");

            await base.OnConnectedAsync();
        }

        public override async Task OnDisconnectedAsync(Exception? exception)
        {
            var userId = Guid.Parse(Context.UserIdentifier!);
            _connectionMapping.Remove(userId, Context.ConnectionId);

            if (Context.User!.IsInRole("Courier"))
            {
                await Clients.Group("Admins")
                    .SendAsync("CourierDisconnected", userId.ToString());
            }

            await base.OnDisconnectedAsync(exception);
        }
    }
}