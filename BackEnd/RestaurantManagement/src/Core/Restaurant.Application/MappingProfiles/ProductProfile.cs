

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
                opt.MapFrom(src => src.Category!.Name));
            CreateMap<Product, GetProductListItemDto>()
                 .ForMember(dest => dest.CategoryName, opt =>
                opt.MapFrom(src => src.Category!.Name));
            CreateMap<PostProductDto, Product>()
                 .ForMember(dest => dest.ImageUrl, opt => opt.Ignore());
            CreateMap<PutProductDto,Product>()
                 .ForMember(dest => dest.ImageUrl, opt => opt.Ignore());
        }
    }
}
