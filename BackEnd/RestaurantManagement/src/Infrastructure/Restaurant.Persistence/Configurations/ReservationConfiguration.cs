
using Microsoft.EntityFrameworkCore;
using Microsoft.EntityFrameworkCore.Metadata.Builders;
using Restaurant.Domain.Entities;

namespace Restaurant.Persistence.Configurations
{
    public class ReservationConfiguration : IEntityTypeConfiguration<Reservation>
    {
        public void Configure(EntityTypeBuilder<Reservation> builder)
        {
            builder.HasKey(r=>r.Id);

            builder.Property(r => r.CustomerName)
                .IsRequired()
                .HasMaxLength(200);
            builder.Property(r=>r.CustomerEmail)
                .IsRequired()
                .HasMaxLength(200);
            builder.OwnsOne(r => r.CustomerPhone, phone =>
            {
                phone.Property(p => p.CountryCode)
                    .HasColumnName("CustomerPhoneCountryCode")
                    .HasMaxLength(10)
                    .IsRequired();

                phone.Property(p => p.Number)
                    .HasColumnName("CustomerPhoneNumber")
                    .HasMaxLength(20)
                    .IsRequired();
            });

            builder.Property(r => r.SpecialRequests)
                .HasMaxLength(500);

            //Relational
            builder.HasOne(r => r.User)
                .WithMany(u => u.Reservations)
                .HasForeignKey(r => r.UserId)
                .OnDelete(DeleteBehavior.SetNull);

            builder.HasOne(r => r.Table)
                .WithMany(t => t.Reservations)
                .HasForeignKey(r =>r.TableId)
                .OnDelete(DeleteBehavior.SetNull);

            builder.HasIndex(r=>r.UserId);
            builder.HasIndex(r => r.TableId);
            builder.HasIndex(r => r.Date);
            builder.HasIndex(r=>r.Status);
            builder.HasIndex(r => new { r.Date, r.Time });

        }
    }
}
