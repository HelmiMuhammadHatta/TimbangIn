using FluentValidation;
using TimbangIn.Application.DTOs.Master;

namespace TimbangIn.Application.Validators
{
    public class CustomerCreateValidator : AbstractValidator<CustomerCreateDto>
    {
        public CustomerCreateValidator()
        {
            RuleFor(x => x.Name).NotEmpty().WithMessage("Nama customer wajib diisi.");
            RuleFor(x => x.Email).EmailAddress().WithMessage("Format email tidak valid.").When(x => !string.IsNullOrEmpty(x.Email));
            RuleFor(x => x.Phone).Matches(@"^(\+62|62|0)8[1-9][0-9]{6,9}$").WithMessage("Format nomor telepon Indonesia tidak valid.").When(x => !string.IsNullOrEmpty(x.Phone));
        }
    }

    public class CustomerUpdateValidator : AbstractValidator<CustomerUpdateDto>
    {
        public CustomerUpdateValidator()
        {
            RuleFor(x => x.Name).NotEmpty().WithMessage("Nama customer wajib diisi.");
            RuleFor(x => x.Email).EmailAddress().WithMessage("Format email tidak valid.").When(x => !string.IsNullOrEmpty(x.Email));
            RuleFor(x => x.Phone).Matches(@"^(\+62|62|0)8[1-9][0-9]{6,9}$").WithMessage("Format nomor telepon Indonesia tidak valid.").When(x => !string.IsNullOrEmpty(x.Phone));
        }
    }
}
