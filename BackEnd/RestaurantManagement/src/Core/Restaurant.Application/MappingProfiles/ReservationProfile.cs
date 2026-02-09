

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
                    opt.MapFrom(src => src.CustomerPhone.FullNumber))
                .ForMember(dest => dest.TableNumber, opt =>
                opt.MapFrom(src => src.Table != null ? src.Table.TableNumber : (int?)null));

            CreateMap<PostReservationDto, Reservation>();
            CreateMap<PutReservationDto, Reservation>();
        }
    }
}
