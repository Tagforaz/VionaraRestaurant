

using AutoMapper;
using Restaurant.Application.DTOs;
using Restaurant.Domain.Entities;

namespace Restaurant.Application.MappingProfiles
{
    internal class ReviewProfile : Profile
    {
        public ReviewProfile()
        {
            CreateMap<Review, GetReviewDto>();
            CreateMap<PostReviewDto, Review>();
            CreateMap<PutReviewDto, Review>();
        }
    }
}
