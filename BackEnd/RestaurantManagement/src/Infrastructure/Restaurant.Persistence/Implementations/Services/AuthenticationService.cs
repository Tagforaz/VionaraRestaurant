

using AutoMapper;
using Microsoft.AspNetCore.Identity;
using Microsoft.EntityFrameworkCore;
using Microsoft.Extensions.Configuration;
using Restaurant.Application.DTOs;
using Restaurant.Application.DTOs.Tokens;
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
        private readonly ITokenService _tokenService;

        public AuthenticationService(UserManager<User> userManager, IMapper mapper,IConfiguration configuration,ITokenService tokenService)
        {
            _userManager = userManager;
            _mapper = mapper;
            _configuration = configuration;
            _tokenService = tokenService;
        }
        public async Task RegisterAsync(RegisterDto userDto)
        {
            var user = _mapper.Map<User>(userDto);
            user.UserName = user.Email!.Split('@')[0]; 

            IdentityResult result = await _userManager.CreateAsync(user,userDto.Password);
            
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

        public async Task<TokenResponseDto> LoginAsync(LoginDto userDto)
        {
            User user = await _userManager.FindByEmailAsync(userDto.Email);
            if (user == null)
            {
                throw new Exception("Email  or  Password is invalid");
            }
            bool result = await _userManager.CheckPasswordAsync(user, userDto.Password);
            if (!result)
            {
                await _userManager.AccessFailedAsync(user);
                throw new Exception("Email  or  Password is invalid");
            }

            return _tokenService.CreateAccessToken(user, 15);
        }
    }
}
