

namespace Restaurant.Domain.ValueObjects
{
    public class PhoneNumber
    {
        public string CountryCode { get; private set; }
        public string Number { get; private set; }

        //sadece EF Core ucundu.Basqa yerde validationsuz yaradila bilmir bele edende
        private PhoneNumber()
        {
            CountryCode = string.Empty;
            Number = string.Empty;
        }

        public static PhoneNumber Create(string fullNumber)
        {
            if (string.IsNullOrWhiteSpace(fullNumber))
                throw new ArgumentException("Phone number cannot be empty");

            if (!fullNumber.StartsWith("+"))
                throw new ArgumentException("Phone number must start with +");

            var countryCode = fullNumber.Substring(0, 4);
            var number = fullNumber.Substring(4);

            if (!System.Text.RegularExpressions.Regex.IsMatch(fullNumber, @"^\+994(50|10|51|55|70|77|99)\d{7}$"))
                throw new ArgumentException("Invalid Azerbaijan phone number format");

            return new PhoneNumber
            {
                CountryCode = countryCode,
                Number = number
            };

        }
        public string FullNumber => $"{CountryCode}{Number}";

        public override bool Equals(object? obj)
        {
            if(obj is not PhoneNumber other) return false;
            return CountryCode==other.CountryCode && Number==other.Number;
        }

        public override int GetHashCode()
        {
            return HashCode.Combine(CountryCode, Number);
        }

        public static bool operator ==(PhoneNumber? left, PhoneNumber? right)
        {
            if(left is null && right is null) return true;
            if(left is null || right is null)return false;
            return left.Equals(right);
        }

        public static bool operator !=(PhoneNumber? left, PhoneNumber? right)
        {
            return !(left == right);
        }

    }
}
