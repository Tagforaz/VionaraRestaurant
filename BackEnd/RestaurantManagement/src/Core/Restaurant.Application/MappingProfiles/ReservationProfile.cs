

using AutoMapper;
using Restaurant.Application.DTOs;
using Restaurant.Domain.Entities;

namespace Restaurant.Application.MappingProfiles
{
    internal class ReservationProfile:Profile
    {
        public ReservationProfile()
        {
            CreateMap<Reservation, GetReservationDto>()
                .ForMember(dest => dest.CustomerPhone, opt =>
                    opt.MapFrom(src => src.CustomerPhone.FullNumber));
            CreateMap<PostReservationDto, Reservation>();
            CreateMap<PutReservationDto, Reservation>();
        }
    }
}
