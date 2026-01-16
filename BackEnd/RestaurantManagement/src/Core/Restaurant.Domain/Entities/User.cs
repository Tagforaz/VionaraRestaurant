

using Microsoft.AspNetCore.Identity;
using Restaurant.Domain.Enums;
using Restaurant.Domain.ValueObjects;

namespace Restaurant.Domain.Entities
{
    public class User : IdentityUser<Guid>, ISoftDelete
    {
        //=string.Empty nullable kimidi amma ustunluyu check elemek lazim deyil

        public string FirstName { get; set; } = string.Empty;
        public string LastName { get; set; } = string.Empty;

        public UserRole Role { get; set; }
        public bool IsActive { get; set; } = true;
        public Address? Address { get; set; }
        public string? AvatarUrl { get; set; }

        //Authentication
        public string? RefreshToken { get; set; }
        public DateTime? RefreshTokenExpiryTime { get; set; }
        public DateTime? LastLoginAt { get; set; }

        //IsoftDelete
        public bool IsDeleted { get; set; }
        public DateTime? DeletedAt { get; set; }
        public string? DeletedBy { get; set; }

        //Relational
        public ICollection<Order> Orders { get; set; } = new List<Order>();
        public ICollection<Reservation> Reservations { get; set; } = new List<Reservation>();
        public ICollection<Review> Reviews { get; set; } = new List<Review>();

        public string FullName => $"{FirstName} {LastName}";
    }
}
