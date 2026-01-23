

using AutoMapper;
using Restaurant.Application.DTOs;
using Restaurant.Domain.Entities;

namespace Restaurant.Application.MappingProfiles
{
    internal class CouponProfile:Profile
    {
        public CouponProfile()
        {
            CreateMap<Coupon, GetCouponDto>();
            CreateMap<Coupon,GetCouponItemDto>();
            CreateMap<PostCouponDto, Coupon>();
            CreateMap<PutCouponDto, Coupon>();
        }
    }
}
