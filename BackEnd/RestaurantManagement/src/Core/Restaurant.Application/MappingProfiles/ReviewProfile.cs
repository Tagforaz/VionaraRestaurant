

using AutoMapper;
using Restaurant.Application.DTOs;
using Restaurant.Domain.Entities;

namespace Restaurant.Application.MappingProfiles
{
    internal class ReviewProfile : Profile
    {
        public ReviewProfile()
        {
            CreateMap<Review, GetReviewDto>()
                 .ForCtorParam("UserName", opt => opt.MapFrom(src => src.User != null ? src.User.UserName : ""));

            CreateMap<PostReviewDto, Review>();
            CreateMap<PutReviewDto, Review>();
        }
    }
}
