using AutoMapper;
using TimbangIn.Application.DTOs.Master;
using TimbangIn.Domain.Entities;

namespace TimbangIn.Application.Mappings
{
    public class MappingProfile : Profile
    {
        public MappingProfile()
        {
            // Customer
            CreateMap<Customer, CustomerDto>();
            CreateMap<CustomerCreateDto, Customer>();
            CreateMap<CustomerUpdateDto, Customer>();

            // TruckMaster
            CreateMap<TruckMaster, TruckDto>()
                .ForMember(dest => dest.CustomerName, opt => opt.MapFrom(src => src.Customer != null ? src.Customer.Name : string.Empty));
            CreateMap<TruckCreateDto, TruckMaster>();
            CreateMap<TruckUpdateDto, TruckMaster>();

            // MaterialType
            CreateMap<MaterialType, MaterialTypeDto>();
            CreateMap<MaterialTypeCreateDto, MaterialType>();
            CreateMap<MaterialTypeUpdateDto, MaterialType>();
        }
    }
}
