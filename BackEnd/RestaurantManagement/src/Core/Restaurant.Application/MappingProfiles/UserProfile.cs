

using AutoMapper;
using Restaurant.Application.DTOs;
using Restaurant.Domain.Entities;
using Restaurant.Domain.ValueObjects;

namespace Restaurant.Application.MappingProfiles
{
    internal class UserProfile:Profile
    {
        public UserProfile()
        {
            CreateMap<RegisterDto, User>()
                .ForMember(u => u.FirstName, opt => opt.MapFrom(r => r.FirstName.ToUpper()))
                .ForMember(u => u.LastName, opt => opt.MapFrom(r => r.LastName.ToUpper()))
                .ForMember(u => u.PhoneNumber, opt => opt.MapFrom(r =>
                    !string.IsNullOrWhiteSpace(r.PhoneNumber)
                        ? PhoneNumber.Create(r.PhoneNumber).FullNumber
                        : null))
                .ForMember(u => u.Address, opt => opt.Ignore());

            CreateMap<UpdateUserDto, User>()
                .ForMember(u => u.FirstName, opt => opt.MapFrom(r => r.FirstName.ToUpper()))
                .ForMember(u => u.LastName, opt => opt.MapFrom(r => r.LastName.ToUpper()))
                .ForMember(u => u.PhoneNumber, opt => opt.MapFrom(r => r.PhoneNumber))
                .ForAllMembers(opts => opts.Condition((src, dest, srcMember) => srcMember != null));
        }
    }
}
