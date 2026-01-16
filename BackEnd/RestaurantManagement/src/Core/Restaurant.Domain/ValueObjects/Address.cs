

namespace Restaurant.Domain.ValueObjects
{
    public class Address
    {
        public string Street { get; private set; }
        public string City { get; private set; }
        public string Country { get; private set; }

        //sadece EF Core ucundu.Basqa yerde validationsuz yaradila bilmir bele edende
        private Address() { }
        public Address(string street, string city, string country)
        {
            Street = street;
            City = city;
            Country = country;
        }

        public string FullAddress => $"{Street}, {City}, {Country}";

    }
}
