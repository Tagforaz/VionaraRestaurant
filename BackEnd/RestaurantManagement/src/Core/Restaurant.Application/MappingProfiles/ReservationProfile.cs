

using AutoMapper;
using Restaurant.Application.DTOs;
using Restaurant.Domain.Entities;

namespace Restaurant.Application.MappingProfiles
{
    internal class ReservationProfile:Profile
    {
        public ReservationProfile()
        {
            CreateMap<Reservation, GetReservationDto>();
            CreateMap<PostReservationDto, Reservation>();
            CreateMap<PutReservationDto, Reservation>();
        }
    }
}
