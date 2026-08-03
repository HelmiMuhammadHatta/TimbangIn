using System.Text.RegularExpressions;

namespace TimbangIn.Application.Utils
{
    public static class StringExtensions
    {
        public static string NormalizePlateNumber(this string plateNumber)
        {
            if (string.IsNullOrWhiteSpace(plateNumber))
                return string.Empty;

            // Remove all non-alphanumeric characters and uppercase
            return Regex.Replace(plateNumber, @"[^A-Za-z0-9]", "").ToUpper();
        }

        public static string FormatPlateNumber(this string plateNumber)
        {
            if (string.IsNullOrWhiteSpace(plateNumber))
                return string.Empty;

            var norm = plateNumber.NormalizePlateNumber();
            var match = Regex.Match(norm, @"^([A-Z]{1,2})([0-9]{1,4})([A-Z]{0,3})$");
            if (match.Success)
            {
                var prefix = match.Groups[1].Value;
                var numbers = match.Groups[2].Value;
                var suffix = match.Groups[3].Value;
                return string.IsNullOrEmpty(suffix) ? $"{prefix} {numbers}" : $"{prefix} {numbers} {suffix}";
            }

            return plateNumber.Trim().ToUpper();
        }
    }
}
