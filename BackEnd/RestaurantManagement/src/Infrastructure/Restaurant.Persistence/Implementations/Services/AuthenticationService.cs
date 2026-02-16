

using AutoMapper;
using Microsoft.AspNetCore.Http;
using Microsoft.AspNetCore.Identity;
using Microsoft.Extensions.Configuration;
using Restaurant.Application.DTOs;
using Restaurant.Application.DTOs.Tokens;
using Restaurant.Application.Exceptions;
using Restaurant.Application.Interfaces.Repositories;
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
        private readonly IEmailService _emailService;
        private readonly IPasswordResetTokenRepository _resetTokenRepository;

        public AuthenticationService(
            UserManager<User> userManager,
            RoleManager<IdentityRole<Guid>> roleManager,
            IMapper mapper,
            IConfiguration configuration,
            ITokenService tokenService,
            IFileService fileService,
            IEmailService emailService,
            IPasswordResetTokenRepository resetTokenRepository)
        {
            _userManager = userManager;
            _roleManager = roleManager;
            _mapper = mapper;
            _configuration = configuration;
            _tokenService = tokenService;
            _fileService = fileService;
            _emailService = emailService;
            _resetTokenRepository = resetTokenRepository;
        }
        public async Task RegisterAsync(RegisterDto userDto)
        {
            var user = _mapper.Map<User>(userDto);
            user.UserName = user.Email!.Split('@')[0];

            user.Role = UserRole.Customer;
            user.IsActive = true;
            user.CreatedAt = DateTime.UtcNow;

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

            if (user.IsDeleted)
            {
                throw new UnauthorizedException("This account has been deleted");
            }

            if (!user.IsActive)
            {
                throw new UnauthorizedException("This account is inactive");
            }

            bool result = await _userManager.CheckPasswordAsync(user, userDto.Password);
            if (!result)
            {
                await _userManager.AccessFailedAsync(user);
                throw new UnauthorizedException("Email  or  Password is invalid");
            }

            await _userManager.ResetAccessFailedCountAsync(user);

            user.LastLoginAt = DateTime.UtcNow;
            await _userManager.UpdateAsync(user);

            var roles=await _userManager.GetRolesAsync(user);
            return _tokenService.CreateAccessToken(user,roles, 60);
        }

        public async Task<AvatarUploadDto> UploadAvatarAsync(Guid userId, IFormFile file)
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

            return new AvatarUploadDto(
                url,
                "Avatar uploaded successfully"
            );
        }

        public async Task<PasswordResetResponseDto> ForgotPasswordAsync(ForgotPasswordDto dto)
        {
            var user = await _userManager.FindByEmailAsync(dto.Email);
            if (user == null)
            {
                
                return new PasswordResetResponseDto(
                    "If your email is registered, you will receive a reset code shortly",
                    5
                );
            }

            if (user.IsDeleted || !user.IsActive)
            {
                throw new BusinessException("This account is not active", "ACCOUNT_INACTIVE");
            }

            
            var latestToken = await _resetTokenRepository.GetLatestTokenAsync(user.Id);
            if (latestToken != null && latestToken.CreatedAt.AddMinutes(1) > DateTime.UtcNow)
            {
                var waitTime = (int)(latestToken.CreatedAt.AddMinutes(1) - DateTime.UtcNow).TotalSeconds;
                throw new BusinessException(
                    $"Please wait {waitTime} seconds before requesting a new code",
                    "RATE_LIMIT_EXCEEDED"
                );
            }
            
            await _resetTokenRepository.InvalidateUserTokensAsync(user.Id);

            
            var code = Random.Shared.Next(1000, 9999).ToString();

            
            var resetToken = new PasswordResetToken
            {
                UserId = user.Id,
                Code = code,
                ExpiresAt = DateTime.UtcNow.AddMinutes(5),
                IsUsed = false
            };

            await _resetTokenRepository.AddAsync(resetToken);
            await _resetTokenRepository.SaveChangesAsync();

            await _emailService.SendPasswordResetCodeAsync(
                user.Email!,
                user.FullName,
                code,
                5
            );

            return new PasswordResetResponseDto(
                "Reset code sent to your email",
                5
            );

        }
        public async Task<PasswordResetResponseDto> VerifyResetCodeAsync(VerifyResetCodeDto dto)
        {
            var user = await _userManager.FindByEmailAsync(dto.Email);
            if (user == null)
            {
                throw new UnauthorizedException("Invalid email or code");
            }

            var token = await _resetTokenRepository.GetValidTokenAsync(user.Id, dto.Code);
            if (token == null)
            {
                throw new UnauthorizedException("Invalid or expired code");
            }

            return new PasswordResetResponseDto(
                "Code verified successfully. You can now reset your password.",
                (int)(token.ExpiresAt - DateTime.UtcNow).TotalMinutes
            );
        }
        public async Task ResetPasswordAsync(ResetPasswordDto dto)
        {
            var user = await _userManager.FindByEmailAsync(dto.Email);
            if (user == null)
            {
                throw new UnauthorizedException("Invalid email or code");
            }

            var token = await _resetTokenRepository.GetValidTokenAsync(user.Id, dto.Code);
            if (token == null)
            {
                throw new UnauthorizedException("Invalid or expired code");
            }


            token.IsUsed = true;
            token.UsedAt = DateTime.UtcNow;
            _resetTokenRepository.Update(token);
            await _resetTokenRepository.SaveChangesAsync();

            var resetToken = await _userManager.GeneratePasswordResetTokenAsync(user);
            var result = await _userManager.ResetPasswordAsync(user, resetToken, dto.NewPassword);

            if (!result.Succeeded)
            {
                var errors = string.Join(", ", result.Errors.Select(e => e.Description));
                throw new ValidationException($"Failed to reset password: {errors}");
            }

            await _userManager.ResetAccessFailedCountAsync(user);
        }
    }
}
