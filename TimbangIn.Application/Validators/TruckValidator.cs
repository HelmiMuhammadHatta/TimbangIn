using FluentValidation;
using TimbangIn.Application.DTOs.Master;
using TimbangIn.Application.Utils;
using TimbangIn.Domain.Entities;
using TimbangIn.Domain.Interfaces;

namespace TimbangIn.Application.Validators
{
    public class TruckCreateValidator : AbstractValidator<TruckCreateDto>
    {
        public TruckCreateValidator(IGenericRepository<TruckMaster> repository)
        {
            RuleFor(x => x.PlateNumber)
                .NotEmpty().WithMessage("Nomor plat wajib diisi.")
                .Matches(@"^[a-zA-Z]{1,2}\s*[0-9]{1,4}(\s*[a-zA-Z]{1,3})?$").WithMessage("Format plat tidak valid (contoh: R 3905 DW atau R3905DW).");

            RuleFor(x => x.CustomerId).NotEmpty().WithMessage("Customer wajib dipilih.");
            RuleFor(x => x.MaxCapacityKg).GreaterThan(0).WithMessage("Kapasitas maksimal harus lebih dari 0.");
        }
    }

    public class TruckUpdateValidator : AbstractValidator<TruckUpdateDto>
    {
        public TruckUpdateValidator(IGenericRepository<TruckMaster> repository)
        {
            RuleFor(x => x.PlateNumber)
                .NotEmpty().WithMessage("Nomor plat wajib diisi.")
                .Matches(@"^[a-zA-Z]{1,2}\s*[0-9]{1,4}(\s*[a-zA-Z]{1,3})?$").WithMessage("Format plat tidak valid (contoh: R 3905 DW atau R3905DW).");

            RuleFor(x => x.CustomerId).NotEmpty().WithMessage("Customer wajib dipilih.");
            RuleFor(x => x.MaxCapacityKg).GreaterThan(0).WithMessage("Kapasitas maksimal harus lebih dari 0.");
        }
    }
}
