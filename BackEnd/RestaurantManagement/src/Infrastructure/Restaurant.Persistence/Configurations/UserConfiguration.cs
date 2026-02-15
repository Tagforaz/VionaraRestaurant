

using Microsoft.EntityFrameworkCore;
using Microsoft.EntityFrameworkCore.Metadata.Builders;
using Restaurant.Domain.Entities;

namespace Restaurant.Persistence.Configurations
{
    public class UserConfiguration : IEntityTypeConfiguration<User>
    {
        public void Configure(EntityTypeBuilder<User> builder)
        {
           builder.HasKey(u=>u.Id);

            builder.Property(u=>u.FirstName)
                .IsRequired()
                .HasMaxLength(50);

            builder.Property(u=>u.LastName)
                .IsRequired()
                .HasMaxLength(50);

            builder.Property(u => u.AvatarUrl)
                .HasMaxLength(500);

            //OwnsOne dan Value Objectlerimi eyni cedvelde saxlamaq ucun istifade etmisem 
            builder.OwnsOne(u => u.Address, address =>
            {
                address.Property(a => a.Street).HasColumnName("Address_Street").HasMaxLength(200);
                address.Property(a => a.City).HasColumnName("Address_City").HasMaxLength(100);
                address.Property(a => a.Country).HasColumnName("Address_Country").HasMaxLength(100);
            });

            //relational
            builder.HasMany(u=>u.Orders)
                .WithOne(o=>o.User)
                .HasForeignKey(o=>o.UserId)
                //DeleteBehavior.Restrict orderi olan useri silmemek ucun istifade etmisem
                .OnDelete(DeleteBehavior.Restrict);

            builder.HasMany(u => u.Reservations)
                .WithOne(r => r.User)
                .HasForeignKey(r => r.UserId)
                .OnDelete(DeleteBehavior.Restrict);

            builder.HasMany(u=>u.Reviews)
                .WithOne(r => r.User)
                .HasForeignKey(r => r.UserId)
                .OnDelete(DeleteBehavior.Restrict);

            builder.HasIndex(u => u.Email)
                .IsUnique()
                .HasFilter("[IsDeleted] = 0")
                .HasDatabaseName("Users_Email_Unique");

       
            builder.HasIndex(u => u.PhoneNumber)
                .IsUnique()
                .HasFilter("[PhoneNumber] IS NOT NULL AND [IsDeleted] = 0")
                .HasDatabaseName("Users_PhoneNumber_Unique");

            //Performansa gore HasIndex isletmisem
            builder.HasIndex(u => u.IsDeleted);
            builder.HasIndex(u => u.Role);
            builder.HasIndex(u => u.IsActive);


        }
    }
}
