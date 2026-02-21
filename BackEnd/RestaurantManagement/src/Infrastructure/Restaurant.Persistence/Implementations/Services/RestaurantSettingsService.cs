

using AutoMapper;
using Microsoft.EntityFrameworkCore;
using Restaurant.Application.DTOs;
using Restaurant.Application.Interfaces.Services;
using Restaurant.Domain.Entities;
using Restaurant.Persistence.Contexts;

namespace Restaurant.Persistence.Implementations.Services
{
    public class RestaurantSettingsService:IRestaurantSettingsService
    {
        private readonly AppDbContext _context;
        private readonly IMapper _mapper;

        public RestaurantSettingsService(AppDbContext context,IMapper mapper)
        {
            _context = context;
            _mapper = mapper;
        }

        public async Task<GetRestaurantSettingsDto> GetAsync()
        {
            var settings = await _context.RestaurantSettings
                .Include(r => r.WorkingHours)
                .FirstOrDefaultAsync();

            if (settings is null)
            {
                settings = new RestaurantSettings
                {
                    Name = "Restaurant",
                    WorkingHours = Enum.GetValues<DayOfWeek>().Select(d => new WorkingHour
                    {
                        DayOfWeek = d,
                        IsOpen = d != DayOfWeek.Sunday,
                        OpenTime = new TimeOnly(10, 0),
                        CloseTime = new TimeOnly(22, 0),
                    }).ToList()
                };
                _context.RestaurantSettings.Add(settings);
                await _context.SaveChangesAsync();
            }

            return _mapper.Map<GetRestaurantSettingsDto>(settings);
        }

        public async Task<GetRestaurantSettingsDto> UpdateAsync(PutRestaurantSettingsDto dto)
        {
            var settings = await _context.RestaurantSettings
                .Include(r => r.WorkingHours)
                .FirstOrDefaultAsync();

            if (settings is null)
                throw new Exception("Restaurant settings not found.");

            settings.Name = dto.Name;
            settings.Address = dto.Address;
            settings.Phone = dto.Phone;
            settings.Email = dto.Email;

            foreach (var whDto in dto.WorkingHours)
            {
                var existing = settings.WorkingHours
                    .FirstOrDefault(w => w.DayOfWeek == whDto.DayOfWeek);

                if (existing is not null)
                {
                    existing.IsOpen = whDto.IsOpen;
                    existing.OpenTime = whDto.OpenTime;
                    existing.CloseTime = whDto.CloseTime;
                }
                else
                {
                    settings.WorkingHours.Add(new WorkingHour
                    {
                        RestaurantSettingsId = settings.Id,
                        DayOfWeek = whDto.DayOfWeek,
                        IsOpen = whDto.IsOpen,
                        OpenTime = whDto.OpenTime,
                        CloseTime = whDto.CloseTime,
                    });
                }
            }

            await _context.SaveChangesAsync();
            return _mapper.Map<GetRestaurantSettingsDto>(settings);
        }
    }
}
    

