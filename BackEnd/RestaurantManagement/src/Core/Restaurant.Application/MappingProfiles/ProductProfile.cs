

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
            CreateMap<Product, GetSoftDeletedProductDto>()
                .ForMember(dest => dest.CategoryName,opt=>
                opt.MapFrom(src => src.Category.Name));
            CreateMap<PostProductDto, Product>()
                .ForMember(dest => dest.Id, opt => opt.Ignore())
                .ForMember(dest => dest.ImageUrl, opt => opt.Ignore())
                .ForMember(dest => dest.AverageRating, opt => opt.Ignore())
                .ForMember(dest => dest.ReviewCount, opt => opt.Ignore())
                .ForMember(dest => dest.CreatedAt, opt => opt.Ignore())
                .ForMember(dest => dest.UpdatedAt, opt => opt.Ignore())
                .ForMember(dest => dest.IsDeleted, opt => opt.Ignore())
                .ForMember(dest => dest.DeletedAt, opt => opt.Ignore())
                .ForMember(dest => dest.DeletedBy, opt => opt.Ignore())
                .ForMember(dest => dest.Category, opt => opt.Ignore())
                .ForMember(dest => dest.OrderItems, opt => opt.Ignore())
                .ForMember(dest => dest.Reviews, opt => opt.Ignore());
            CreateMap<PutProductDto,Product>()
                 .ForMember(dest => dest.ImageUrl, opt => opt.Ignore());
        }
    }
}
