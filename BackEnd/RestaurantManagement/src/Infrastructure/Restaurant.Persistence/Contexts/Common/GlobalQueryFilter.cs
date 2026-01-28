


using Microsoft.EntityFrameworkCore;
using Restaurant.Domain.Entities;


namespace Restaurant.Persistence.Contexts.Common
{
    internal static class GlobalQueryFilter
    {
        public static void  ApplyAllQueryFilters(this ModelBuilder builder)
        {
            builder.ApplyQueryFilter<Category>();
            builder.ApplyQueryFilter<Product>();
            builder.ApplyQueryFilter<Courier>();
            builder.ApplyQueryFilter<Coupon>();
            builder.ApplyQueryFilter<User>();

        }
      public static void ApplyQueryFilter<T>(this ModelBuilder builder) where T:class, ISoftDelete,new()
        {
            builder.Entity<T>().HasQueryFilter(x => x.IsDeleted == false);
        }
    }
}
