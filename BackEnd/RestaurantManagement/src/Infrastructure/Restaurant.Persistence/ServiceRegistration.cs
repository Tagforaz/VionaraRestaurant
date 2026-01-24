

using Microsoft.EntityFrameworkCore;
using Microsoft.Extensions.Configuration;
using Microsoft.Extensions.DependencyInjection;
using Restaurant.Application.Interfaces.Repositories;
using Restaurant.Application.Interfaces.Services;
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

            services.AddScoped<ICategoryRepository,CategoryRepository>();
            services.AddScoped<IProductRepository,ProductRepository>();
            services.AddScoped<ICouponRepository,CouponRepository>();
            services.AddScoped<IOrderRepository,OrderRepository>();
            services.AddScoped<IReservationRepository,ReservationRepository>();
            services.AddScoped<IReviewRepository,ReviewRepository>();
            services.AddScoped<ICourierRepository,CourierRepository>();
            services.AddScoped<IDeliveryTrackingRepository, DeliveryTrackingRepository>();

            services.AddScoped<ICategoryService,CategoryService>();
            services.AddScoped<ICouponService,CouponService>();
            services.AddScoped<ICourierService,CourierService>();
            services.AddScoped<IDeliveryTrackingService,DeliveryTrackingService>();

            return services;
        }
    }
}
