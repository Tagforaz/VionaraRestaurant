

using AutoMapper;
using Restaurant.Application.DTOs;
using Restaurant.Domain.Entities;

namespace Restaurant.Application.MappingProfiles
{
    internal class CourierProfile:Profile
    {
        public CourierProfile()
        {
            CreateMap<Courier,GetCourierDto>()
                .ForMember(dest=>dest.UserFullName, opt=>
                opt.MapFrom(src=>$"{src.User.FirstName} {src.User.LastName}"));

            CreateMap<Courier, GetCourierListItemDto>()
                .ForMember(dest => dest.UserFullName, opt =>
                opt.MapFrom(src => $"{src.User.FirstName} {src.User.LastName}"));

            CreateMap<PostCourierDto, Courier>();
            CreateMap<PutCourierDto,Courier>();
        }
    }
}
