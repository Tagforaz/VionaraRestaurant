

using AutoMapper;
using Restaurant.Application.DTOs;
using Restaurant.Domain.Entities;

namespace Restaurant.Application.MappingProfiles
{
    internal class TableProfile : Profile
    {
        public TableProfile()
        {
            CreateMap<Table, GetTableDto>();
            CreateMap<PostTableDto, Table>()
                .ForMember(dest => dest.IsAvailable, opt => opt.MapFrom(src => true))
                .ForMember(dest => dest.Id, opt => opt.Ignore())
                .ForMember(dest => dest.CreatedAt, opt => opt.Ignore())
                .ForMember(dest => dest.UpdatedAt, opt => opt.Ignore())
                .ForMember(dest => dest.Reservations, opt => opt.Ignore())
                .ForMember(dest => dest.Orders, opt => opt.Ignore());

            CreateMap<PutTableDto, Table>()
               .ForMember(dest => dest.Id, opt => opt.Ignore())
               .ForMember(dest => dest.CreatedAt, opt => opt.Ignore())
               .ForMember(dest => dest.UpdatedAt, opt => opt.Ignore())
               .ForMember(dest => dest.Reservations, opt => opt.Ignore())
               .ForMember(dest => dest.Orders, opt => opt.Ignore());

            CreateMap<Table, GetAvailableTableDto>()
               .ForMember(dest => dest.IsBooked, opt => opt.Ignore());
        }
    }
}
