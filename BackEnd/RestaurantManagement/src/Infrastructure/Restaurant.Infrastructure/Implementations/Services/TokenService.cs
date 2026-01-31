
using Microsoft.Extensions.Configuration;
using Microsoft.IdentityModel.Tokens;
using Restaurant.Application.DTOs.Tokens;
using Restaurant.Application.Interfaces.Services;
using Restaurant.Domain.Entities;
using System.IdentityModel.Tokens.Jwt;
using System.Security.Claims;
using System.Text;

namespace Restaurant.Infrastructure.Implementations.Services
{
    internal class TokenService:ITokenService
    {
        private readonly IConfiguration _configuration;
        public TokenService(IConfiguration configuration)
        {
            _configuration = configuration;
        }
        

        public  TokenResponseDto CreateAccessToken(User user,int minutes)
        {
            JwtSecurityToken securityToken = new JwtSecurityToken(
              issuer: _configuration["JWT:issuer"],
              audience: _configuration["Jwt:audience"],
              expires: DateTime.UtcNow.AddMinutes(minutes),
              notBefore: DateTime.UtcNow,
              claims: new List<Claim>
           {
                new Claim(ClaimTypes.NameIdentifier, user.Id.ToString()),
                new Claim(ClaimTypes.Name,user.UserName),
                new Claim (ClaimTypes.Email,user.Email),
                new Claim(ClaimTypes.Surname,user.LastName),
                new Claim(ClaimTypes.GivenName,user.FirstName)
           },
              signingCredentials: new SigningCredentials(
                  new SymmetricSecurityKey(
                      Encoding.ASCII.GetBytes(_configuration["JWT:secretKey"])),
                  SecurityAlgorithms.HmacSha256)
               );

            return new TokenResponseDto(
                new JwtSecurityTokenHandler().WriteToken(securityToken),
                user.UserName,
                securityToken.ValidTo);
        }
    }
}
