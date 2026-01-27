

using AutoMapper;
using Restaurant.Application.DTOs;
using Restaurant.Domain.Entities;

namespace Restaurant.Application.MappingProfiles
{
    internal class ProductProfile : Profile
    {
        public ProductProfile()
        {
            CreateMap<Product, GetProductDto>()
                .ForMember(dest => dest.CategoryName, opt =>
                opt.MapFrom(src => src.Category.Name));
            CreateMap<Product, GetProductListItemDto>();
            CreateMap<PostProductDto, Product>();
            CreateMap<PutProductDto,Product>();
        }
    }
}
