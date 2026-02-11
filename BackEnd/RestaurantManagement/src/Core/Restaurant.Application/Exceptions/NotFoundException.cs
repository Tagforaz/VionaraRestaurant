

namespace Restaurant.Application.Exceptions
{
    public class NotFoundException:BaseException
    {
        public NotFoundException(string entityName,object key)
            :base($"{entityName} with ID '{key}' was not found",404,"NOT_FOUND")
        {

        }
        public NotFoundException(string message)
            :base(message,404,"NOT_FOUND")
        {

        }
    }
}
