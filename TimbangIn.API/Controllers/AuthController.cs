using Microsoft.AspNetCore.Authorization;
using Microsoft.AspNetCore.Mvc;
using TimbangIn.Application.DTOs.Auth;
using TimbangIn.Application.Interfaces;

namespace TimbangIn.API.Controllers
{
    [Route("api/[controller]")]
    [ApiController]
    public class AuthController : ControllerBase
    {
        private readonly IAuthService _authService;

        public AuthController(IAuthService authService)
        {
            _authService = authService;
        }

        [HttpPost("login")]
        public async Task<IActionResult> Login([FromBody] LoginRequest request)
        {
            var response = await _authService.LoginAsync(request);
            
            SetRefreshTokenCookie(response.RefreshToken!);

            return Ok(new
            {
                success = true,
                message = "Login successful",
                data = new
                {
                    token = response.Token,
                    username = response.Username,
                    role = response.Role
                }
            });
        }

        [HttpPost("refresh")]
        public async Task<IActionResult> Refresh()
        {
            var refreshToken = Request.Cookies["refreshToken"];
            if (string.IsNullOrEmpty(refreshToken))
                return Unauthorized(new { success = false, message = "Refresh token is missing" });

            try
            {
                var response = await _authService.RefreshTokenAsync(refreshToken);
                
                SetRefreshTokenCookie(response.RefreshToken!);

                return Ok(new
                {
                    success = true,
                    message = "Token refreshed successfully",
                    data = new
                    {
                        token = response.Token,
                        username = response.Username,
                        role = response.Role
                    }
                });
            }
            catch (UnauthorizedAccessException)
            {
                return Unauthorized(new { success = false, message = "Invalid or expired refresh token" });
            }
        }

        [HttpPost("logout")]
        [Authorize]
        public async Task<IActionResult> Logout()
        {
            var username = User.Identity?.Name;
            if (username != null)
            {
                await _authService.LogoutAsync(username);
            }

            Response.Cookies.Delete("refreshToken");

            return Ok(new { success = true, message = "Logged out successfully", data = (object)null });
        }

        private void SetRefreshTokenCookie(string refreshToken)
        {
            var cookieOptions = new CookieOptions
            {
                HttpOnly = true,
                Expires = DateTime.UtcNow.AddDays(7),
                Secure = true, // In production, ensure this is true
                SameSite = SameSiteMode.Strict
            };
            Response.Cookies.Append("refreshToken", refreshToken, cookieOptions);
        }
    }
}
