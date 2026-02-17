
using Amazon;
using Amazon.Extensions.NETCore.Setup;
using Amazon.Runtime;
using Amazon.S3;
using Microsoft.AspNetCore.Builder;
using Microsoft.AspNetCore.Identity;
using Microsoft.EntityFrameworkCore;
using Microsoft.Extensions.Configuration;
using Microsoft.Extensions.DependencyInjection;
using Restaurant.Application.Interfaces.Repositories;
using Restaurant.Application.Interfaces.Services;
using Restaurant.Domain.Entities;
using Restaurant.Persistence.Contexts;
using Restaurant.Persistence.Implementations.Repositories;
using Restaurant.Persistence.Implementations.Services;

namespace Restaurant.Persistence
{
    public static class ServiceRegistration
    {
        public static IServiceCollection AddPersistenceServices(this IServiceCollection services, IConfiguration config)
        {
            services.AddDbContext<AppDbContext>(opt => opt.UseSqlServer(config.GetConnectionString("Default")));

            services.AddIdentity<User, IdentityRole<Guid>>(opt =>
            {
                opt.Password.RequireNonAlphanumeric = false;
                opt.Password.RequiredLength = 8;
                opt.User.RequireUniqueEmail = true;
                opt.Lockout.AllowedForNewUsers = true;
                opt.Lockout.MaxFailedAccessAttempts = 5;
                opt.Lockout.DefaultLockoutTimeSpan = TimeSpan.FromMinutes(5);
            }).AddDefaultTokenProviders().AddEntityFrameworkStores<AppDbContext>();

            services.AddDefaultAWSOptions(new AWSOptions
            {
                Credentials = new BasicAWSCredentials(
                    config["AWS:AccessKey"],
                    config["AWS:SecretKey"]
                ),
                Region = RegionEndpoint.GetBySystemName(config["AWS:Region"])
            });
            services.AddAWSService<IAmazonS3>();

            services.AddScoped<ICategoryRepository, CategoryRepository>();
            services.AddScoped<IProductRepository, ProductRepository>();
            services.AddScoped<ICouponRepository, CouponRepository>();
            services.AddScoped<IOrderRepository, OrderRepository>();
            services.AddScoped<IReservationRepository, ReservationRepository>();
            services.AddScoped<IReviewRepository, ReviewRepository>();
            services.AddScoped<ICourierRepository, CourierRepository>();
            services.AddScoped<IDeliveryTrackingRepository, DeliveryTrackingRepository>();
            services.AddScoped<ITableRepository, TableRepository>();
            services.AddScoped<IPasswordResetTokenRepository, PasswordResetTokenRepository>();
            services.AddScoped<ILocationHistoryRepository, LocationHistoryRepository>();

            services.AddScoped<ICategoryService, CategoryService>();
            services.AddScoped<ICouponService, CouponService>();
            services.AddScoped<ICourierService, CourierService>();
            services.AddScoped<IDeliveryTrackingService, DeliveryTrackingService>();
            services.AddScoped<IOrderService, OrderService>();
            services.AddScoped<IProductService, ProductService>();
            services.AddScoped<IReviewService, ReviewService>();
            services.AddScoped<IReservationService, ReservationService>();
            services.AddScoped<ITableService, TableService>();
            services.AddScoped<IRoleManagementService, RoleManagementService>();
            services.AddScoped<IUserService, UserService>();

            services.AddScoped<IAuthenticationService, AuthenticationService>();

            services.AddScoped<IFileService, FileStorageService>();

            services.AddScoped<AppDbContextInitializer>();


            return services;
        }

        public static async Task<IApplicationBuilder> UseAppDbContextInitializer(this IApplicationBuilder app,IServiceScope scope)
        {
          
            var initializer = scope.ServiceProvider.GetRequiredService<AppDbContextInitializer>();

            await initializer.InitializeDbContext();
            await initializer.InitializeRolesAsync();
            await initializer.InitializeAdmin();

            return app;
        }
    }
}
