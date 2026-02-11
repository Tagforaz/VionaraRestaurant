

namespace Restaurant.Application.Exceptions
{
    public class UnauthorizedException:BaseException
    {
        public UnauthorizedException(string message = "Unauthorized access")
            :base(message,401,"UNAUTHORIZED")
        {

        }
    }
}
