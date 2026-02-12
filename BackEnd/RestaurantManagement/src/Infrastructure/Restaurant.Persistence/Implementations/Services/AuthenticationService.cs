

using AutoMapper;
using Microsoft.AspNetCore.Http;
using Microsoft.AspNetCore.Identity;
using Microsoft.Extensions.Configuration;
using Restaurant.Application.DTOs;
using Restaurant.Application.DTOs.Tokens;
using Restaurant.Application.Exceptions;
using Restaurant.Application.Interfaces.Services;
using Restaurant.Domain.Entities;
using Restaurant.Domain.Enums;
using System.Text;

namespace Restaurant.Persistence.Implementations.Services
{
    internal class AuthenticationService : IAuthenticationService
    {
        private readonly UserManager<User> _userManager;
        private readonly RoleManager<IdentityRole<Guid>> _roleManager;
        private readonly IMapper _mapper;
        private readonly IConfiguration _configuration;
        private readonly ITokenService _tokenService;
        private readonly IFileService _fileService;

        public AuthenticationService(UserManager<User> userManager,RoleManager<IdentityRole<Guid>> roleManager, IMapper mapper, IConfiguration configuration, ITokenService tokenService,IFileService fileService)
        {
            _userManager = userManager;
            _roleManager = roleManager;
            _mapper = mapper;
            _configuration = configuration;
            _tokenService = tokenService;
            _fileService = fileService;
        }
        public async Task RegisterAsync(RegisterDto userDto)
        {
            var user = _mapper.Map<User>(userDto);
            user.UserName = user.Email!.Split('@')[0];

            IdentityResult result = await _userManager.CreateAsync(user, userDto.Password);

            if (!result.Succeeded)
            {
                StringBuilder sb = new();
                foreach (IdentityError error in result.Errors)
                {
                    sb.Append(error.Description);
                }
                throw new Exception(sb.ToString());
            }

            var roleExists = await _roleManager.RoleExistsAsync(UserRole.Customer.ToString());
            if (!roleExists)
            {
                await _roleManager.CreateAsync(new IdentityRole<Guid> { Name = UserRole.Customer.ToString() });
            }

            await _userManager.AddToRoleAsync(user, UserRole.Customer.ToString());
        }

        public async Task<TokenResponseDto> LoginAsync(LoginDto userDto)
        {
            User user = await _userManager.FindByEmailAsync(userDto.Email);
            if (user == null)
            {
                throw new UnauthorizedException("Email  or  Password is invalid");
            }
            bool result = await _userManager.CheckPasswordAsync(user, userDto.Password);
            if (!result)
            {
                await _userManager.AccessFailedAsync(user);
                throw new UnauthorizedException("Email  or  Password is invalid");
            }

            var roles=await _userManager.GetRolesAsync(user);
            return _tokenService.CreateAccessToken(user,roles, 15);
        }

        public async Task UploadAvatarAsync(Guid userId, IFormFile file)
        {
            var user = await _userManager.FindByIdAsync(userId.ToString());
            if (user == null)
                throw new NotFoundException("User",userId);

            if (!string.IsNullOrEmpty(user.AvatarUrl))
            {
                await _fileService.DeleteAsync(user.AvatarUrl);
            }

            var url = await _fileService.UploadAsync(file, "avatars");

            user.AvatarUrl = url;
            await _userManager.UpdateAsync(user);
        }
    }
}
