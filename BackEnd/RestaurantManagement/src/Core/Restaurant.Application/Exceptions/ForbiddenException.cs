

namespace Restaurant.Application.Exceptions
{
    public class ForbiddenException:BaseException
    {
        public ForbiddenException(string message = "Acces to this resource is forbidden")
            : base(message, 403, "FORBIDDEN")
        {

        }
    }
}
