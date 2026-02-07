

using AutoMapper;
using Restaurant.Application.DTOs;
using Restaurant.Domain.Entities;

namespace Restaurant.Application.MappingProfiles
{
    internal class CourierProfile : Profile
    {
        public CourierProfile()
        {
            CreateMap<Courier, GetCourierDto>()
                .ForMember(dest => dest.UserFullName, opt =>
                opt.MapFrom(src => $"{src.User.FirstName} {src.User.LastName}"));

            CreateMap<Courier, GetCourierListItemDto>()
                .ForMember(dest => dest.UserFullName, opt =>
                opt.MapFrom(src => $"{src.User.FirstName} {src.User.LastName}"));

            CreateMap<PostCourierDto, Courier>()
                .ForMember(dest => dest.UserId, opt => opt.Ignore())
                .ForMember(dest => dest.User, opt => opt.Ignore())
                .ForMember(dest => dest.Status, opt => opt.MapFrom(src => Domain.Enums.CourierStatus.Available))
                .ForMember(dest => dest.IsAvailable, opt => opt.MapFrom(src => true))
                .ForMember(dest => dest.AverageRating, opt => opt.MapFrom(src => 0m))
                .ForMember(dest => dest.CompletedDeliveries, opt => opt.MapFrom(src => 0));

            CreateMap<PutCourierDto, Courier>();

            CreateMap<PostCourierDto, User>()
               .ForMember(dest => dest.UserName, opt => opt.MapFrom(src => src.Email))
               .ForMember(dest => dest.EmailConfirmed, opt => opt.MapFrom(src => true))
               .ForMember(dest => dest.Id, opt => opt.Ignore())
               .ForMember(dest => dest.PasswordHash, opt => opt.Ignore())
               .ForMember(dest => dest.SecurityStamp, opt => opt.Ignore())
               .ForMember(dest => dest.ConcurrencyStamp, opt => opt.Ignore())
               .ForMember(dest => dest.NormalizedEmail, opt => opt.Ignore())
               .ForMember(dest => dest.NormalizedUserName, opt => opt.Ignore())
               .ForMember(dest => dest.PhoneNumberConfirmed, opt => opt.Ignore())
               .ForMember(dest => dest.TwoFactorEnabled, opt => opt.Ignore())
               .ForMember(dest => dest.LockoutEnd, opt => opt.Ignore())
               .ForMember(dest => dest.LockoutEnabled, opt => opt.Ignore())
               .ForMember(dest => dest.AccessFailedCount, opt => opt.Ignore());
        }
    }
}
