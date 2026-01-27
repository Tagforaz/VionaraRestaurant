
using AutoMapper;
using Restaurant.Application.Interfaces.Repositories;
using Restaurant.Application.Interfaces.Services;

namespace Restaurant.Persistence.Implementations.Services
{
    public class ReservationService : IReservationService
    {
        private readonly IReservationRepository _repository;
        private readonly IMapper _mapper;

        public ReservationService(IReservationRepository repository,IMapper mapper)
        {
            _repository = repository;
            _mapper = mapper;
        }
    }
}
