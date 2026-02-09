

namespace Restaurant.Domain.ValueObjects
{
    public class Address
    {
        public string Street { get; private set; }
        public string City { get; private set; }
        public string Country { get; private set; }

        //sadece EF Core ucundu.Basqa yerde validationsuz yaradila bilmir bele edende
        private Address()
        {
            Street = string.Empty;
            City = string.Empty;
            Country = string.Empty;
        }
        public Address(string street, string city, string country)
        {
            if (string.IsNullOrWhiteSpace(street))
                throw new ArgumentException("Street cannot be empty", nameof(street));
            if (string.IsNullOrWhiteSpace(city))
                throw new ArgumentException("City cannot be empty", nameof(city));
            if (string.IsNullOrWhiteSpace(country))
                throw new ArgumentException("Country cannot be empty", nameof(country));
            Street = street;
            City = city;
            Country = country;
        }

        public static Address Create(string fullAddress)
        {
            if (string.IsNullOrWhiteSpace(fullAddress))
                throw new ArgumentException("Address cannot be empty", nameof(fullAddress));

            var parts = fullAddress.Split(',', StringSplitOptions.TrimEntries);

            if (parts.Length < 3)
                throw new ArgumentException(
                     "Address must contain Street, City, and Country separated by commas. " +
                     "Example: 'Qedirli Street 130, Baku, Azerbaijan'",
                     nameof(fullAddress));

            return new Address(parts[0], parts[1], parts[2]);

        }

        public string FullAddress => $"{Street}, {City}, {Country}";

        public override bool Equals(object? obj)
        {
            if(obj is not Address other) return false;
            return Street == other.Street && City == other.City && Country == other.Country;
        }
        public override int GetHashCode()
        {
            return HashCode.Combine(Street, City, Country);
        }
        public static bool operator ==(Address? left,Address? right)
        {
            if (left is null && right is null) return true;
            if (left is null || right is null) return false;
            return left.Equals(right);
        }

        public static bool operator !=(Address? left, Address? right)
        {
            return !(left == right);
        }
    }
}
