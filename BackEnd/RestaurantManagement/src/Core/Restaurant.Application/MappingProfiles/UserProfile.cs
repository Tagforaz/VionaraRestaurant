

using AutoMapper;
using Restaurant.Application.DTOs;
using Restaurant.Domain.Entities;

namespace Restaurant.Application.MappingProfiles
{
    internal class UserProfile:Profile
    {
        public UserProfile()
        {
            CreateMap<RegisterDto, User>()
                .ForMember(u => u.FirstName, opt => opt.MapFrom(r => r.FirstName.ToUpper()))
                 .ForMember(u => u.LastName, opt => opt.MapFrom(r => r.LastName.ToUpper()));

        }
    }
}
