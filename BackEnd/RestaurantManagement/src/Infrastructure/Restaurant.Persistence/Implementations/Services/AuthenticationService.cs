

using AutoMapper;
using Microsoft.AspNetCore.Http;
using Microsoft.AspNetCore.Identity;
using Microsoft.Extensions.Configuration;
using Microsoft.Extensions.Logging;
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
        private readonly ILogger<AuthenticationService> _logger;

        public AuthenticationService(
            UserManager<User> userManager,
            RoleManager<IdentityRole<Guid>> roleManager,
            IMapper mapper,
            IConfiguration configuration,
            ITokenService tokenService,
            IFileService fileService,
            IEmailService emailService,
            IPasswordResetTokenRepository resetTokenRepository,
            ILogger<AuthenticationService> logger
            )
        {
            _userManager = userManager;
            _roleManager = roleManager;
            _mapper = mapper;
            _configuration = configuration;
            _tokenService = tokenService;
            _fileService = fileService;
            _emailService = emailService;
            _resetTokenRepository = resetTokenRepository;
            _logger = logger;
        }
        public async Task RegisterAsync(RegisterDto userDto)
        {
            _logger.LogInformation($"Registration attempt for email: {userDto.Email}");

            if (await _userManager.FindByEmailAsync(userDto.Email) != null)
            {
                _logger.LogWarning($"Email already exists: {userDto.Email}");
                throw new BusinessException($"Email '{userDto.Email}' is already registered", "EMAIL_EXISTS");
            }

            var user = _mapper.Map<User>(userDto);
            var baseUsername = user.Email!.Split('@')[0].ToLower();
            user.UserName = $"{baseUsername}_{Guid.NewGuid().ToString().Substring(0, 8)}";
            user.Role = UserRole.Customer;
            user.IsActive = true;
            user.EmailConfirmed = true;
            user.CreatedAt = DateTime.UtcNow;

            IdentityResult result = await _userManager.CreateAsync(user, userDto.Password);

            if (!result.Succeeded)
            {
                StringBuilder sb = new();
                foreach (IdentityError error in result.Errors)
                {
                    sb.AppendLine(error.Description);
                }
                _logger.LogError($"User creation failed: {sb}");
                throw new ValidationException($"Registration failed: {sb}");
            }

            var roleExists = await _roleManager.RoleExistsAsync(UserRole.Customer.ToString());
            if (!roleExists)
            {
                await _roleManager.CreateAsync(new IdentityRole<Guid> { Name = UserRole.Customer.ToString() });
                _logger.LogInformation($"Created role: {UserRole.Customer}");
               
            }

            await _userManager.AddToRoleAsync(user, UserRole.Customer.ToString());
            await _emailService.SendWelcomeEmailAsync(user.Email!, user.FullName);
            _logger.LogInformation($"User registered successfully: {user.Email}");
        }

        public async Task<TokenResponseDto> LoginAsync(LoginDto userDto)
        {
            _logger.LogInformation($"Login attempt for email: {userDto.Email}");

            User user = await _userManager.FindByEmailAsync(userDto.Email);
            if (user == null)
            {
                _logger.LogWarning($"User not found: {userDto.Email}");
                throw new UnauthorizedException("Email  or  Password is invalid");
            }
            _logger.LogInformation($"User found - ID: {user.Id}, IsActive: {user.IsActive}, IsDeleted: {user.IsDeleted}, Role: {user.Role}");
            if (user.IsDeleted)
            {
                _logger.LogWarning($"Deleted user attempted login: {userDto.Email}");
                throw new UnauthorizedException("This account has been deleted");
            }

            if (!user.IsActive)
            {
                _logger.LogWarning($"Inactive user attempted login: {userDto.Email}");
                throw new UnauthorizedException("This account is inactive");
            }
            if (await _userManager.IsLockedOutAsync(user))
            {
                var lockoutEnd = await _userManager.GetLockoutEndDateAsync(user);
                var remainingMinutes = (lockoutEnd.Value - DateTimeOffset.UtcNow).TotalMinutes;
                _logger.LogWarning($"Locked out user attempted login: {userDto.Email}. Unlocks in {remainingMinutes} minutes");
                throw new UnauthorizedException($"Account is locked due to multiple failed login attempts. Try again in {Math.Ceiling(remainingMinutes)} minutes.");
            }

            bool result = await _userManager.CheckPasswordAsync(user, userDto.Password);
            if (!result)
            {
                _logger.LogWarning($"Invalid password for user: {userDto.Email}");
                await _userManager.AccessFailedAsync(user);

                var failedCount = await _userManager.GetAccessFailedCountAsync(user);
                _logger.LogWarning($"Failed login attempt #{failedCount} for user: {userDto.Email}");

                if (await _userManager.IsLockedOutAsync(user))
                {
                    var lockoutEnd = await _userManager.GetLockoutEndDateAsync(user);
                    _logger.LogWarning($"User locked out: {userDto.Email} until {lockoutEnd}");
                    throw new UnauthorizedException("Too many failed login attempts. Account locked for 5 minutes.");
                }

                var attemptsRemaining = await _userManager.GetLockoutEnabledAsync(user)
                    ? 5 - failedCount
                    : 0;

                if (attemptsRemaining > 0)
                {
                    throw new UnauthorizedException($"Email or Password is invalid. {attemptsRemaining} attempts remaining.");
                }
                else
                {
                    throw new UnauthorizedException("Email or Password is invalid");
                }
            }

            await _userManager.ResetAccessFailedCountAsync(user);
            await _userManager.SetLockoutEndDateAsync(user, null);

            _logger.LogInformation($"Login successful for user: {userDto.Email}");

            user.LastLoginAt = DateTime.UtcNow;
            await _userManager.UpdateAsync(user);

            var roles = await _userManager.GetRolesAsync(user);
            return _tokenService.CreateAccessToken(user, roles, 60);
        }

        public async Task<AvatarUploadDto> UploadAvatarAsync(Guid userId, IFormFile file)
        {
            _logger.LogInformation($"Avatar upload attempt for user: {userId}");
            var user = await _userManager.FindByIdAsync(userId.ToString());
            if (user == null)
            {
                _logger.LogWarning($"User not found for avatar upload: {userId}");
                throw new NotFoundException("User", userId);
            }
               

            if (!string.IsNullOrEmpty(user.AvatarUrl))
            {
                await _fileService.DeleteAsync(user.AvatarUrl);
                _logger.LogInformation($"Deleted old avatar for user: {userId}");
            }

            var url = await _fileService.UploadAsync(file, "avatars");

            user.AvatarUrl = url;
            await _userManager.UpdateAsync(user);

            _logger.LogInformation($"Avatar uploaded successfully for user: {userId}");

            return new AvatarUploadDto(
                url,
                "Avatar uploaded successfully"
            );
        }

        public async Task<PasswordResetResponseDto> ForgotPasswordAsync(ForgotPasswordDto dto)
        {
            _logger.LogInformation($"Password reset requested for email: {dto.Email}");

            var user = await _userManager.FindByEmailAsync(dto.Email);
            if (user == null)
            {
                _logger.LogWarning($"Password reset requested for non-existent email: {dto.Email}");
                return new PasswordResetResponseDto(
                    "If your email is registered, you will receive a reset code shortly",
                    5
                );
            }

            if (user.IsDeleted || !user.IsActive)
            {
                _logger.LogWarning($"Password reset attempted for inactive/deleted user: {dto.Email}");
                throw new BusinessException("This account is not active", "ACCOUNT_INACTIVE");
            }

            
            var latestToken = await _resetTokenRepository.GetLatestTokenAsync(user.Id);
            if (latestToken != null && latestToken.CreatedAt.AddMinutes(1) > DateTime.UtcNow)
            {
                var waitTime = (int)(latestToken.CreatedAt.AddMinutes(1) - DateTime.UtcNow).TotalSeconds;
                _logger.LogWarning($"Rate limit exceeded for password reset: {dto.Email}");
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

            _logger.LogInformation($"Password reset code sent to: {dto.Email}");

            return new PasswordResetResponseDto(
                "Reset code sent to your email",
                5
            );

        }
        public async Task<PasswordResetResponseDto> VerifyResetCodeAsync(VerifyResetCodeDto dto)
        {
            _logger.LogInformation($"Verifying reset code for email: {dto.Email}");

            var user = await _userManager.FindByEmailAsync(dto.Email);
            if (user == null)
            {
                _logger.LogWarning($"Reset code verification failed - user not found: {dto.Email}");
                throw new UnauthorizedException("Invalid email or code");
            }

            var token = await _resetTokenRepository.GetValidTokenAsync(user.Id, dto.Code);
            if (token == null)
            {
                _logger.LogWarning($"Invalid or expired reset code for: {dto.Email}");
                throw new UnauthorizedException("Invalid or expired code");
            }
            _logger.LogInformation($"Reset code verified for: {dto.Email}");
            return new PasswordResetResponseDto(
                "Code verified successfully. You can now reset your password.",
                (int)(token.ExpiresAt - DateTime.UtcNow).TotalMinutes
            );
        }
        public async Task ResetPasswordAsync(ResetPasswordDto dto)
        {
            _logger.LogInformation($"Password reset attempt for email: {dto.Email}");
            var user = await _userManager.FindByEmailAsync(dto.Email);
            if (user == null)
            {
                _logger.LogWarning($"Password reset failed - user not found: {dto.Email}");
                throw new UnauthorizedException("Invalid email or code");
            }

            var token = await _resetTokenRepository.GetValidTokenAsync(user.Id, dto.Code);
            if (token == null)
            {
                _logger.LogWarning($"Invalid or expired reset code for: {dto.Email}");
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
                _logger.LogError($"Password reset failed for {dto.Email}: {errors}");
                throw new ValidationException($"Failed to reset password: {errors}");
            }

            await _userManager.ResetAccessFailedCountAsync(user);
            await _userManager.SetLockoutEndDateAsync(user, null);

            _logger.LogInformation($"Password reset successful for: {dto.Email}");
        }
    }
}
