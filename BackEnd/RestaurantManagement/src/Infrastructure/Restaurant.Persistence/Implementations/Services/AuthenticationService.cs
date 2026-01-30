

using AutoMapper;
using Microsoft.AspNetCore.Identity;
using Microsoft.Extensions.Configuration;
using Restaurant.Application.DTOs;
using Restaurant.Application.Interfaces.Services;
using Restaurant.Domain.Entities;
using System.Text;

namespace Restaurant.Persistence.Implementations.Services
{
    internal class AuthenticationService : IAuthenticationService
    {
        private readonly UserManager<User> _userManager;
        private readonly IMapper _mapper;
        private readonly IConfiguration _configuration;

        public AuthenticationService(UserManager<User> userManager, IMapper mapper,IConfiguration configuration)
        {
            _userManager = userManager;
            _mapper = mapper;
            _configuration = configuration;
        }
        public async Task RegisterAsync(RegisterDto userDto)
        {
            var user = _mapper.Map<User>(userDto);
            user.UserName = user.Email!.Split('@')[0]; 

            IdentityResult result = await _userManager.CreateAsync(user);
            
            if(!result.Succeeded)
            {
                StringBuilder sb = new();
                foreach (IdentityError error in result.Errors)
                {
                    sb.Append(error.Description);
                }
                throw new Exception(sb.ToString());
            }
        }

        public async Task LoginAsync(LoginDto userDto)
        {

        }
    }
}
