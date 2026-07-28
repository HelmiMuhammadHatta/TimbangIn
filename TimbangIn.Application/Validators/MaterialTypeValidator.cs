using FluentValidation;
using TimbangIn.Application.DTOs.Master;

namespace TimbangIn.Application.Validators
{
    public class MaterialTypeCreateValidator : AbstractValidator<MaterialTypeCreateDto>
    {
        public MaterialTypeCreateValidator()
        {
            RuleFor(x => x.Name).NotEmpty().WithMessage("Nama material wajib diisi.");
            RuleFor(x => x.Unit).NotEmpty().WithMessage("Satuan wajib diisi.");
        }
    }

    public class MaterialTypeUpdateValidator : AbstractValidator<MaterialTypeUpdateDto>
    {
        public MaterialTypeUpdateValidator()
        {
            RuleFor(x => x.Name).NotEmpty().WithMessage("Nama material wajib diisi.");
            RuleFor(x => x.Unit).NotEmpty().WithMessage("Satuan wajib diisi.");
        }
    }
}
