

using Microsoft.AspNetCore.Identity;
using Microsoft.AspNetCore.Identity.EntityFrameworkCore;
using Microsoft.EntityFrameworkCore;
using Restaurant.Domain.Entities;
using Restaurant.Persistence.Contexts.Common;
using System.Reflection;

namespace Restaurant.Persistence.Contexts
{
    public class AppDbContext:IdentityDbContext<User,IdentityRole<Guid>,Guid>
    {
        public AppDbContext(DbContextOptions<AppDbContext> options):base(options) { }

        protected override void OnModelCreating(ModelBuilder modelBuilder)
        {
            modelBuilder.ApplyConfigurationsFromAssembly(Assembly.GetExecutingAssembly());
            modelBuilder.ApplyAllQueryFilters();
            base.OnModelCreating(modelBuilder);


           
        }
        public override int SaveChanges()
        {
            _setDateTime();
            return base.SaveChanges();
        }
        public override async Task<int> SaveChangesAsync(CancellationToken cancellationToke = default)
        {
            _setDateTime();
            return await base.SaveChangesAsync(cancellationToke);
        }

        private void _setDateTime()
        {
            var datas = ChangeTracker.Entries<BaseAuditableEntity>();
            foreach(var entry in datas)
            {
                if(entry.State== EntityState.Modified)
                {
                    entry.Entity.UpdatedAt=DateTime.UtcNow;
                }
                else if(entry.State== EntityState.Added)
                {
                    entry.Entity.CreatedAt=DateTime.UtcNow;
                }
            }
        }
        public DbSet<Order> Orders { get; set; }
        public DbSet<OrderItem> OrderItems { get; set; }
        public DbSet<Product> Products { get; set; }
        public DbSet<Category> Categories { get; set; }
        public DbSet<Review> Reviews { get; set; }
        public DbSet<Reservation> Reservations { get; set; }
        public DbSet<Courier> Couriers { get; set; }
        public DbSet<DeliveryTracking> DeliveryTrackings { get; set; }
        public DbSet<Coupon> Coupons { get; set; }
        public DbSet<Table> Tables { get; set; }
        
       
    }
}
