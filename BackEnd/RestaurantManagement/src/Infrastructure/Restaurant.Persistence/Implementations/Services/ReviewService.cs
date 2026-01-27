
using AutoMapper;
using Microsoft.EntityFrameworkCore;
using Restaurant.Application.DTOs;
using Restaurant.Application.Interfaces.Repositories;
using Restaurant.Application.Interfaces.Services;
using Restaurant.Domain.Entities;

namespace Restaurant.Persistence.Implementations.Services
{
    public class ReviewService : IReviewService
    {
        private readonly IReviewRepository _repository;
        private readonly IMapper _mapper;

        public ReviewService(IReviewRepository repository, IMapper mapper)
        {
            _repository = repository;
            _mapper = mapper;
        }

        public async Task CreateAsync(PostReviewDto reviewDto)
        {
            var review = _mapper.Map<Review>(reviewDto);
            await _repository.AddAsync(review);
            await _repository.SaveChangesAsync();
        }

        public async Task DeleteAsync(Guid id)
        {
            var review = await _repository.GetByIdAsync(id);
            if (review == null) throw new Exception("Review not found");
            _repository.Delete(review);
            await _repository.SaveChangesAsync();
        }

        public async Task<IReadOnlyList<GetReviewDto>> GetAllAsync(int page, int take)
        {
            var reviews = await _repository.GetAll(
                orderBy: r => r.CreatedAt,
                asNoTracking: true,
                page: page,
                take: take)
                .ToListAsync();

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
            if (review == null) throw new Exception("Review  not found");

            _mapper.Map(reviewDto, review);
            _repository.Update(review);
            await _repository.SaveChangesAsync();
        }
    }
}
