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
    }
}
