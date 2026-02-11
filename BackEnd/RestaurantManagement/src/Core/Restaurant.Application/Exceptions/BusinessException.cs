

namespace Restaurant.Application.Exceptions
{
    public class BusinessException:BaseException
    {
        public BusinessException(string message)
            :base(message,400,"BUSINESS _ERROR")
        {

        }
        public BusinessException(string message,string errorCode)
            :base(message,40,errorCode)
        {

        }
    }
}
