

namespace Restaurant.Domain.ValueObjects
{
    public class PhoneNumber
    {
        public string CountryCode { get; private set; }
        public string Number { get; private set; }

        //sadece EF Core ucundu.Basqa yerde validationsuz yaradila bilmir bele edende
        private PhoneNumber() { }

        public PhoneNumber(string countryCode, string number)
        
            {
                CountryCode = countryCode;
                Number = number;
            }
        public string FullNumber => $"{CountryCode}{Number}";
    }
}
