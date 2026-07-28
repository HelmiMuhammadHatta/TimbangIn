using TimbangIn.Application.DTOs.Auth;
using TimbangIn.Application.Interfaces;
using TimbangIn.Domain.Entities;
using TimbangIn.Domain.Interfaces;

namespace TimbangIn.Application.Services
{
    public class AuthService : IAuthService
    {
        private readonly IGenericRepository<User> _userRepository;
        private readonly ITokenService _tokenService;
        private readonly IPermissionRepository _permissionRepository;

        public AuthService(IGenericRepository<User> userRepository, ITokenService tokenService, IPermissionRepository permissionRepository)
        {
            _userRepository = userRepository;
            _tokenService = tokenService;
            _permissionRepository = permissionRepository;
        }

        public async Task<AuthResponse> LoginAsync(LoginRequest request)
        {
            var users = await _userRepository.FindAsync(u => u.Username.ToLower() == request.Username.ToLower());
            var user = users.FirstOrDefault();

            if (user == null || !BCrypt.Net.BCrypt.Verify(request.Password, user.PasswordHash))
            {
                throw new UnauthorizedAccessException("Invalid username or password");
            }

            var permissions = await _permissionRepository.GetPermissionsByRoleAsync(user.Role);
            var accessToken = _tokenService.GenerateAccessToken(user, permissions);
            var refreshToken = _tokenService.GenerateRefreshToken();

            user.RefreshToken = refreshToken;
            user.RefreshTokenExpiry = DateTime.UtcNow.AddDays(7);
            
            _userRepository.Update(user);
            await _userRepository.SaveChangesAsync();

            return new AuthResponse
            {
                Token = accessToken,
                Username = user.Username,
                Role = user.Role.ToString(),
                Permissions = permissions,
                RefreshToken = refreshToken
            };
        }

        public async Task<AuthResponse> RefreshTokenAsync(string refreshToken)
        {
            var users = await _userRepository.FindAsync(u => u.RefreshToken == refreshToken);
            var user = users.FirstOrDefault();

            if (user == null || user.RefreshTokenExpiry <= DateTime.UtcNow)
            {
                throw new UnauthorizedAccessException("Invalid or expired refresh token");
            }

            var permissions = await _permissionRepository.GetPermissionsByRoleAsync(user.Role);
            var newAccessToken = _tokenService.GenerateAccessToken(user, permissions);
            var newRefreshToken = _tokenService.GenerateRefreshToken();

            user.RefreshToken = newRefreshToken;
            user.RefreshTokenExpiry = DateTime.UtcNow.AddDays(7);

            _userRepository.Update(user);
            await _userRepository.SaveChangesAsync();

            return new AuthResponse
            {
                Token = newAccessToken,
                Username = user.Username,
                Role = user.Role.ToString(),
                Permissions = permissions,
                RefreshToken = newRefreshToken
            };
        }

        public async Task LogoutAsync(string username)
        {
            var users = await _userRepository.FindAsync(u => u.Username == username);
            var user = users.FirstOrDefault();
            
            if (user != null)
            {
                user.RefreshToken = null;
                user.RefreshTokenExpiry = null;
                _userRepository.Update(user);
                await _userRepository.SaveChangesAsync();
            }
        }
    }
}
