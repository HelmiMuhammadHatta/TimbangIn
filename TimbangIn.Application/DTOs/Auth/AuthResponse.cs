namespace TimbangIn.Application.DTOs.Auth
{
    public class AuthResponse
    {
        public string Token { get; set; } = string.Empty;
        public string Username { get; set; } = string.Empty;
        public string Role { get; set; } = string.Empty;
        public IEnumerable<string> Permissions { get; set; } = new List<string>();
        public string? RefreshToken { get; set; } // Only if we want to return it in JSON, else handled by HttpOnly cookie
    }
}
