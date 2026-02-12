
namespace Restaurant.Application.Common
{
    public class PagedResult<T>
    {
        public int Page { get; set; }
        public int Take { get; set; }
        public int TotalCount { get; set; }
        public int TotalPages { get; set; }
        public List<T> Data { get; set; }

        public PagedResult()
        {
            Data = new List<T>();
        }

        public PagedResult(List<T> data, int count, int page, int take)
        {
            Data = data;
            TotalCount = count;
            Page = page;
            Take = take;
            TotalPages = (int)Math.Ceiling(count / (double)take);
        }
    }
}
