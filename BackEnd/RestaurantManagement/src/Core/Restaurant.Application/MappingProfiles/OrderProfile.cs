

using AutoMapper;
using Microsoft.Extensions.Configuration;
using Restaurant.Application.DTOs;
using Restaurant.Domain.Entities;

namespace Restaurant.Application.MappingProfiles
{
    internal class OrderProfile:Profile
    {
        public OrderProfile()
        {
            CreateMap<Order, GetOrderDto>();
            CreateMap<Order,GetOrderListItemDto>();
            CreateMap<OrderItem,GetOrderItemDto>();
            CreateMap<PostOrderDto, Order>();
            CreateMap<PostOrderItemDto, OrderItem>();
            CreateMap<PutOrderDto,Order>();
        }
    }
}
