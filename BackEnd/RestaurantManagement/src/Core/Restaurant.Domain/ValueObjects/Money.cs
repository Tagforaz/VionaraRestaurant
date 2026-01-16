

namespace Restaurant.Domain.ValueObjects
{
    public class Money
    {
        public decimal Amount { get; private set; }
        public string Currency { get; private set; }

        //sadece EF Core ucundu.Basqa yerde validationsuz yaradila bilmir bele edende
        private Money() { }
        public Money(decimal amount,string currency = "AZN")
        {
            Amount=Math.Round(amount,2);
            Currency=currency;
        }
        public static Money Zero() => new Money(0);

        public static Money operator +(Money a, Money b) => new Money(a.Amount + b.Amount);
        public static Money operator -(Money a, Money b) => new Money(a.Amount - b.Amount);
        public static Money operator *(Money m,int quantity) => new Money(m.Amount * quantity);
    }
}
