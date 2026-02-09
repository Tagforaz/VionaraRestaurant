

using AutoMapper;
using Restaurant.Application.DTOs;
using Restaurant.Domain.Entities;

namespace Restaurant.Application.MappingProfiles
{
    internal class TableProfile :Profile
    {
        public TableProfile()
        {
            CreateMap<Table, GetTableDto>();
            CreateMap<PostTableDto, Table>();
            CreateMap<PutTableDto, Table>();
        }
    }
}
