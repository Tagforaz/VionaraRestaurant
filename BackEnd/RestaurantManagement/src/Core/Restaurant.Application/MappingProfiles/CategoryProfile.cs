

using AutoMapper;
using Restaurant.Application.DTOs;
using Restaurant.Domain.Entities;

namespace Restaurant.Application.MappingProfiles
{
    internal class CategoryProfile:Profile
    {
        public CategoryProfile()
        {
            CreateMap<Category, GetCategoryDto>();
            CreateMap<Category, GetCategoryItemDto>();
            CreateMap<PostCategoryDto, Category>();
            CreateMap<PutCategoryDto,Category>();
        }
    }
}
