

using AutoMapper;
using Microsoft.AspNetCore.Identity;
using Restaurant.Application.DTOs;
using Restaurant.Application.Interfaces.Services;
using Restaurant.Domain.Entities;

namespace Restaurant.Persistence.Implementations.Services
{
    internal class AuthenticationService : IAuthenticationService
    {
        private readonly UserManager<User> _userManager;
        private readonly IMapper _mapper;

        public AuthenticationService(UserManager<User> userManager, IMapper mapper)
        {
            _userManager = userManager;
            _mapper = mapper;
        }
        public async Task RegisterAsync(RegisterDto userDto)
        {
            await _userManager.CreateAsync(_mapper.Map<User>(userDto)); 
        }
    }
}
