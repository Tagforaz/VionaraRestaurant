

using Microsoft.AspNetCore.Identity;
using Microsoft.EntityFrameworkCore;
using Microsoft.Extensions.Configuration;
using Restaurant.Domain.Entities;
using Restaurant.Domain.Enums;

namespace Restaurant.Persistence.Contexts
{
    internal class AppDbContextInitializer
    {
        private readonly RoleManager<IdentityRole<Guid>> _roleManager;
        private readonly UserManager<User> _userManager;
        private readonly IConfiguration _configuration;
        private readonly AppDbContext _context;

        public AppDbContextInitializer(
            RoleManager<IdentityRole<Guid>> roleManager,
            UserManager<User> userManager,
            IConfiguration configuration,
            AppDbContext context
            )
        {
            _roleManager = roleManager;
            _userManager = userManager;
            _configuration = configuration;
            _context = context;
        }

        public async Task InitializeDbContext()
        {
            if((await _context.Database.GetPendingMigrationsAsync()).Any())
            {
                await _context.Database.MigrateAsync();
            }
        }
        public async Task InitializeAdmin()
        {
            bool result = await _userManager.Users.AnyAsync(u => u.UserName == _configuration["AdminSettings:userName"] || u.Email == _configuration["AdminSettings:email"]);
            if (!result)
            {
                User user = new User
                {
                    FirstName = "Admin",
                    LastName = "Admin",
                    UserName = _configuration["AdminSettings:userName"],
                    Email = _configuration["AdminSettings:email"],
                    EmailConfirmed = true,
                    Role = UserRole.Admin
                };
                await _userManager.CreateAsync(user, _configuration["AdminSettings:password"]);
                await _userManager.AddToRoleAsync(user, UserRole.Admin.ToString());
            }

        }
        public async Task InitializeRolesAsync()
        {
            foreach (UserRole role in Enum.GetValues(typeof(UserRole)))
            {
                if (!await _roleManager.RoleExistsAsync(role.ToString()))
                {
                    await _roleManager.CreateAsync(new IdentityRole<Guid> { Name = role.ToString() });
                }
            }
        }
    }
}
