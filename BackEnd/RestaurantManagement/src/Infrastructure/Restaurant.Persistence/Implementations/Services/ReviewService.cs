
using AutoMapper;
using Microsoft.EntityFrameworkCore;
using Restaurant.Application.DTOs;
using Restaurant.Application.Interfaces.Repositories;
using Restaurant.Application.Interfaces.Services;
using Restaurant.Domain.Entities;
using Restaurant.Application.Exceptions;

namespace Restaurant.Persistence.Implementations.Services
{
    public class ReviewService : IReviewService
    {
        private readonly IReviewRepository _repository;
        private readonly IProductRepository _productRepository;
        private readonly IMapper _mapper;

        public ReviewService(IReviewRepository repository,IProductRepository productRepository, IMapper mapper)
        {
            _repository = repository;
            _productRepository = productRepository;
            _mapper = mapper;
        }

        public async Task CreateAsync(PostReviewDto reviewDto)
        {
            if (reviewDto.ProductId.HasValue)
            {
                var alreadyReviewed = reviewDto.OrderId.HasValue
                    ? await _repository
                        .GetAll(filter: r =>
                            r.UserId == reviewDto.UserId &&
                            r.ProductId == reviewDto.ProductId &&
                            r.OrderId == reviewDto.OrderId)
                        .AnyAsync()
                    : await _repository
                        .GetAll(filter: r =>
                            r.UserId == reviewDto.UserId &&
                            r.ProductId == reviewDto.ProductId)
                        .AnyAsync();

                if (alreadyReviewed)
                    throw new BusinessException(
                        "You have already submitted a review for this product in this order",
                        "REVIEW_ALREADY_EXISTS");
            }

            var review = _mapper.Map<Review>(reviewDto);
            await _repository.AddAsync(review);
            await _repository.SaveChangesAsync();

            if (reviewDto.ProductId.HasValue)
                await UpdateProductRatingAsync(reviewDto.ProductId.Value);
        }

        public async Task DeleteAsync(Guid id)
        {
            var review = await _repository.GetByIdAsync(id);
            if (review == null) throw new NotFoundException("Review",id);

            var productId = review.ProductId;

            _repository.Delete(review);
            await _repository.SaveChangesAsync();

            if(productId.HasValue)
            {
                await UpdateProductRatingAsync(productId.Value);
            }
        }

        public async Task<IReadOnlyList<GetReviewDto>> GetAllAsync(
            int page,
            int take,
            Guid? productId = null,
            Guid? userId = null)
        {
            var query = _repository.GetAll(
                orderBy: r => r.CreatedAt,
                asNoTracking: true,
                page: page,
                take: take);

            if (productId.HasValue)
            {
                query = query.Where(r => r.ProductId == productId && r.IsApproved);
            }
            else if (userId.HasValue)
            {
                query = query.Where(r => r.UserId == userId);
            }

            var reviews = await query.Include(r => r.User).ToListAsync();
            return _mapper.Map<IReadOnlyList<GetReviewDto>>(reviews);
        }


        public async Task<GetReviewDto?> GetByIdAsync(Guid id)
        {
            var review = await _repository.GetByIdAsync(id);
            return review == null ? null : _mapper.Map<GetReviewDto>(review);
        }

        public async Task UpdateAsync(Guid id, PutReviewDto reviewDto)
        {
            var review = await _repository.GetByIdAsync(id);
            if (review == null) throw new NotFoundException("Review",id);

            var oldProductId = review.ProductId;

            _mapper.Map(reviewDto, review);
            _repository.Update(review);
            await _repository.SaveChangesAsync();

            if (oldProductId.HasValue)
            {
                await UpdateProductRatingAsync(oldProductId.Value);
            }

        }

        private async Task UpdateProductRatingAsync(Guid productId)
        {
            var product = await _productRepository.GetAll(
                filter: p => p.Id == productId,
                asNoTracking: false)
                .Include(p => p.Reviews)
                .FirstOrDefaultAsync();
            if (product == null) return;

            var approvedReviews = product.Reviews
                .Where(r=>r.IsApproved&&r.ProductId== productId)
                .ToList();

            product.ReviewCount = approvedReviews.Count;

            if (product.ReviewCount > 0)
            {
                product.AverageRating = (decimal)approvedReviews.Average(r => r.Rating);
            }
            else
            {
                product.AverageRating = 0;
            }
            _productRepository.Update(product);
            await _productRepository.SaveChangesAsync();
        }

        public async Task ApproveReviewAsync(Guid reviewId,Guid approvedByUserId)
        {
            var review = await _repository.GetByIdAsync(reviewId);
            if (review == null) throw new NotFoundException("Review",reviewId);

            review.IsApproved = true;
            review.ApprovedBy= approvedByUserId;
            review.ApprovedAt = DateTime.UtcNow;

            _repository.Update(review);
            await _repository.SaveChangesAsync();

            if(review.ProductId.HasValue)
            {
                await UpdateProductRatingAsync(review.ProductId.Value);
            }
        }
    }
}
