

using AutoMapper;
using Restaurant.Application.Interfaces.Repositories;
using Restaurant.Application.Interfaces.Services;

namespace Restaurant.Persistence.Implementations.Services
{
    public class TableService:ITableService
    {
        private readonly ITableRepository _repository;
        private readonly IReservationRepository _reservationRepository;
        private readonly IMapper _mapper;

        public TableService(ITableRepository repository,IReservationRepository reservationRepository,IMapper mapper)
        {
            _repository = repository;
            _reservationRepository = reservationRepository;
            _mapper = mapper;
        }

    }
}
