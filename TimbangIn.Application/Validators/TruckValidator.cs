using FluentValidation;
using TimbangIn.Application.DTOs.Master;
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
                .Matches(@"^[A-Z]{1,2}\s\d{1,4}\s[A-Z]{1,3}$").WithMessage("Format plat tidak valid (misal: B 1234 XYZ).")
                .MustAsync(async (plate, cancellation) => 
                {
                    bool exists = await repository.ExistsAsync(t => t.PlateNumber == plate);
                    return !exists;
                }).WithMessage("Nomor plat sudah terdaftar.");

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
                .Matches(@"^[A-Z]{1,2}\s\d{1,4}\s[A-Z]{1,3}$").WithMessage("Format plat tidak valid (misal: B 1234 XYZ).");

            RuleFor(x => x.CustomerId).NotEmpty().WithMessage("Customer wajib dipilih.");
            RuleFor(x => x.MaxCapacityKg).GreaterThan(0).WithMessage("Kapasitas maksimal harus lebih dari 0.");
        }
    }
}
