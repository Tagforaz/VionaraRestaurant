

using AutoMapper;
using Restaurant.Application.DTOs;
using Restaurant.Domain.Entities;

namespace Restaurant.Application.MappingProfiles
{
    internal class OrderProfile : Profile
    {
        public OrderProfile()
        {
            CreateMap<Order, GetOrderDto>()
                .ForMember(dest => dest.UserEmail, opt =>
                opt.MapFrom(src => src.User != null ? src.User.Email : string.Empty))
                .ForMember(dest => dest.TableNumber, opt =>
                opt.MapFrom(src => src.Table != null ? src.Table.TableNumber : (int?)null))
                .ForMember(dest => dest.CourierName, opt =>
                opt.MapFrom(src => src.Courier != null ? src.Courier.User.UserName : null))
                .ForMember(dest => dest.DeliveryAddress, opt =>
                opt.MapFrom(src => src.DeliveryAddress != null ? src.DeliveryAddress.FullAddress : null));

            CreateMap<Order, GetOrderListItemDto>()
               .ForMember(dest => dest.UserEmail, opt =>
                opt.MapFrom(src => src.User != null ? src.User.Email : string.Empty))
               .ForMember(dest => dest.TableNumber, opt =>
                opt.MapFrom(src => src.Table != null ? src.Table.TableNumber : (int?)null))
               .ForMember(dest => dest.DeliveryType, opt =>
                opt.MapFrom(src => src.Type));

            CreateMap<OrderItem, GetOrderItemDto>()
                .ForMember(dest => dest.TotalPrice, opt =>
                opt.MapFrom(src => src.Price * src.Quantity)); ;
            CreateMap<PostOrderDto, Order>()
                .ForMember(dest => dest.Items, opt => opt.Ignore())
                .ForMember(dest => dest.DeliveryAddress, opt => opt.Ignore())
                .ForMember(dest => dest.Table, opt => opt.Ignore())
                .ForMember(dest => dest.CreatedAt, opt => opt.Ignore())
                .ForMember(dest => dest.UpdatedAt, opt => opt.Ignore())
                .ForMember(dest => dest.CreatedBy, opt => opt.Ignore())
                .ForMember(dest => dest.UpdatedBy, opt => opt.Ignore())
                .ForMember(dest => dest.Items, opt => opt.Ignore())
                .ForMember(dest => dest.OrderNumber, opt => opt.Ignore())
                .ForMember(dest => dest.Subtotal, opt => opt.Ignore())
                .ForMember(dest => dest.Total, opt => opt.Ignore())
                .ForMember(dest => dest.DiscountAmount, opt => opt.Ignore())
                .ForMember(dest => dest.Status, opt => opt.Ignore())
                .ForMember(dest => dest.Coupon, opt => opt.Ignore())
                .ForMember(dest => dest.Courier, opt => opt.Ignore())
                .ForMember(dest => dest.User, opt => opt.Ignore());
            CreateMap<PutOrderDto, Order>()
                .ForMember(dest => dest.Id, opt => opt.Ignore())
                .ForMember(dest => dest.OrderNumber, opt => opt.Ignore())
                .ForMember(dest => dest.UserId, opt => opt.Ignore())
                .ForMember(dest => dest.Type, opt => opt.Ignore())
                .ForMember(dest => dest.TableId, opt => opt.Ignore())
                .ForMember(dest => dest.Items, opt => opt.Ignore())
                .ForMember(dest => dest.Subtotal, opt => opt.Ignore())
                .ForMember(dest => dest.Total, opt => opt.Ignore())
                .ForMember(dest => dest.DiscountAmount, opt => opt.Ignore())
                .ForMember(dest => dest.OrderNotes, opt => opt.Ignore())
                .ForMember(dest => dest.DeliveryAddress, opt => opt.Ignore())
                .ForMember(dest => dest.CouponId, opt => opt.Ignore())
                .ForMember(dest => dest.User, opt => opt.Ignore())
                .ForMember(dest => dest.Table, opt => opt.Ignore())
                .ForMember(dest => dest.Coupon, opt => opt.Ignore())
                .ForMember(dest => dest.Courier, opt => opt.Ignore())
                .ForMember(dest => dest.CreatedAt, opt => opt.Ignore())
                .ForMember(dest => dest.UpdatedAt, opt => opt.Ignore())
                .ForMember(dest => dest.CreatedBy, opt => opt.Ignore())
                .ForMember(dest => dest.UpdatedBy, opt => opt.Ignore());
        }
    }
}
