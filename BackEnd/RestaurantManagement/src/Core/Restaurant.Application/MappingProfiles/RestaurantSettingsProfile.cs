

using AutoMapper;
using Restaurant.Application.DTOs;
using Restaurant.Domain.Entities;

namespace Restaurant.Application.MappingProfiles
{
    public class RestaurantSettingsProfile : Profile
    {
        public RestaurantSettingsProfile()
        {
            CreateMap<RestaurantSettings, GetRestaurantSettingsDto>()
               .ConstructUsing((src, ctx) => new GetRestaurantSettingsDto(
                    src.Name,
                    src.Address,
                    src.Phone,
                    src.Email,
                    ctx.Mapper.Map<List<GetWorkingHoursDto>>(src.WorkingHours)
    ));

            CreateMap<WorkingHour, GetWorkingHoursDto>()
                .ConstructUsing(src => new GetWorkingHoursDto(
                    src.DayOfWeek,
                    src.IsOpen,
                    src.OpenTime,
                    src.CloseTime
    ));
        }
    }
}
