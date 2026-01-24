
using AutoMapper;
using Restaurant.Application.DTOs;
using Restaurant.Domain.Entities;

namespace Restaurant.Application.MappingProfiles
{
    internal class DeliveryTrackingProfile:Profile
    {
        public DeliveryTrackingProfile()
        {
            CreateMap<PostDeliveryTrackingDto, DeliveryTracking>();
            CreateMap<PutDeliveryTrackingDto, DeliveryTracking>();
        }
    }
}
