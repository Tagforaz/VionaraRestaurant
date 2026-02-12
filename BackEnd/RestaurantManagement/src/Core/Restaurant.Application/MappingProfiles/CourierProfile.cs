

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

            CreateMap<Courier, GetSoftDeletedCourierDto>()
               .ForMember(dest => dest.UserFullName, opt =>
                   opt.MapFrom(src => $"{src.User.FirstName} {src.User.LastName}"))
               .ForMember(dest => dest.Email, opt =>
                   opt.MapFrom(src => src.User.Email));

            CreateMap<PostCourierDto, Courier>()
                .ForMember(dest => dest.Id, opt => opt.Ignore())
                .ForMember(dest => dest.User, opt => opt.Ignore())
                .ForMember(dest => dest.ImageUrl, opt => opt.Ignore())
                .ForMember(dest => dest.Status, opt => opt.Ignore())
                .ForMember(dest => dest.IsAvailable, opt => opt.Ignore())
                .ForMember(dest => dest.AverageRating, opt => opt.Ignore())
                .ForMember(dest => dest.CompletedDeliveries, opt => opt.Ignore())
                .ForMember(dest => dest.CreatedAt, opt => opt.Ignore())
                .ForMember(dest => dest.UpdatedAt, opt => opt.Ignore())
                .ForMember(dest => dest.IsDeleted, opt => opt.Ignore())
                .ForMember(dest => dest.DeletedAt, opt => opt.Ignore())
                .ForMember(dest => dest.DeletedBy, opt => opt.Ignore())
                .ForMember(dest => dest.Orders, opt => opt.Ignore())
                .ForMember(dest => dest.DeliveryTracking, opt => opt.Ignore());

            CreateMap<PutCourierDto, Courier>()
                .ForMember(dest => dest.ImageUrl, opt => opt.Ignore());

            CreateMap<CreateCourierByAdminDto, User>()
               .ForMember(dest => dest.UserName, opt =>
                 opt.ConvertUsing(new EmailToUsernameConverter(), src => src.Email))
               .ForMember(dest => dest.EmailConfirmed, opt => opt.MapFrom(src => true))
               .ForMember(dest => dest.Role, opt => opt.MapFrom(src => Domain.Enums.UserRole.Courier))
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
               .ForMember(dest => dest.AccessFailedCount, opt => opt.Ignore())
               .ForMember(dest => dest.IsActive, opt => opt.MapFrom(src => true))
               .ForMember(dest => dest.Address, opt => opt.Ignore())
               .ForMember(dest => dest.AvatarUrl, opt => opt.Ignore())
               .ForMember(dest => dest.RefreshToken, opt => opt.Ignore())
               .ForMember(dest => dest.RefreshTokenExpiryTime, opt => opt.Ignore())
               .ForMember(dest => dest.LastLoginAt, opt => opt.Ignore())
               .ForMember(dest => dest.IsDeleted, opt => opt.Ignore())
               .ForMember(dest => dest.DeletedAt, opt => opt.Ignore())
               .ForMember(dest => dest.DeletedBy, opt => opt.Ignore())
               .ForMember(dest => dest.Orders, opt => opt.Ignore())
               .ForMember(dest => dest.Reservations, opt => opt.Ignore())
               .ForMember(dest => dest.Reviews, opt => opt.Ignore());

            CreateMap<CreateCourierByAdminDto, Courier>()
                .ForMember(dest => dest.UserId, opt => opt.Ignore())
                .ForMember(dest => dest.User, opt => opt.Ignore())
                .ForMember(dest => dest.ImageUrl, opt => opt.Ignore())
                .ForMember(dest => dest.Status, opt => opt.MapFrom(src => Domain.Enums.CourierStatus.Available))
                .ForMember(dest => dest.IsAvailable, opt => opt.MapFrom(src => true))
                .ForMember(dest => dest.AverageRating, opt => opt.MapFrom(src => 0m))
                .ForMember(dest => dest.CompletedDeliveries, opt => opt.MapFrom(src => 0))
                .ForMember(dest => dest.Id, opt => opt.Ignore())
                .ForMember(dest => dest.CreatedAt, opt => opt.Ignore())
                .ForMember(dest => dest.UpdatedAt, opt => opt.Ignore())
                .ForMember(dest => dest.IsDeleted, opt => opt.Ignore())
                .ForMember(dest => dest.DeletedAt, opt => opt.Ignore())
                .ForMember(dest => dest.DeletedBy, opt => opt.Ignore())
                .ForMember(dest => dest.Orders, opt => opt.Ignore())
                .ForMember(dest => dest.DeliveryTracking, opt => opt.Ignore());
        }
        public class EmailToUsernameConverter : IValueConverter<string, string>
        {
            public string Convert(string sourceMember, ResolutionContext context)
            {
                if (string.IsNullOrEmpty(sourceMember))
                    return "courier_user";

                var atIndex = sourceMember.IndexOf('@');
                return atIndex > 0 ? sourceMember.Substring(0, atIndex) : sourceMember;
            }
        }
    }
}