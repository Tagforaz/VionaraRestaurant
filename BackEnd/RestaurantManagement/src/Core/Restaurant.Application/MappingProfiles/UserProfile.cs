

using AutoMapper;
using Restaurant.Application.DTOs;
using Restaurant.Domain.Entities;

namespace Restaurant.Application.MappingProfiles
{
    internal class UserProfile:Profile
    {
        public UserProfile()
        {
            CreateMap<RegisterDto, User>();
        }
    }
}
