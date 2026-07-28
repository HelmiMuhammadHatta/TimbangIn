using Microsoft.Extensions.Configuration;
using System;
using System.IO;
using System.Net.Http;
using System.Net.Http.Headers;
using System.Text.Json;
using System.Threading.Tasks;
using TimbangIn.Application.DTOs.Weighbridge;
using TimbangIn.Application.Interfaces;

namespace TimbangIn.Infrastructure.Services
{
    public class HttpAnprService : IAnprService
    {
        private readonly HttpClient _httpClient;
        private readonly IConfiguration _configuration;

        public HttpAnprService(HttpClient httpClient, IConfiguration configuration)
        {
            _httpClient = httpClient;
            _configuration = configuration;
        }

        public async Task<AnprResult> DetectPlateAsync(byte[] imageBytes, string fileName)
        {
            // Fallback base URL if not configured
            var baseUrl = _configuration["AnprService:BaseUrl"] ?? "http://localhost:8000";
            var endpoint = $"{baseUrl}/detect-plate";

            using var content = new MultipartFormDataContent();
            using var fileContent = new ByteArrayContent(imageBytes);
            
            // Set content type for the image
            fileContent.Headers.ContentType = MediaTypeHeaderValue.Parse("image/jpeg");
            
            content.Add(fileContent, "image", fileName);

            try
            {
                var response = await _httpClient.PostAsync(endpoint, content);

                if (!response.IsSuccessStatusCode)
                {
                    // For now, return empty result on failure so it can be handled as unmatched
                    return new AnprResult
                    {
                        PlateNumber = "",
                        Confidence = 0,
                        DetectedAt = DateTime.UtcNow
                    };
                }

                var jsonString = await response.Content.ReadAsStringAsync();
                var result = JsonSerializer.Deserialize<AnprResponseDto>(jsonString, new JsonSerializerOptions
                {
                    PropertyNameCaseInsensitive = true
                });

                return new AnprResult
                {
                    PlateNumber = result?.PlateNumber ?? "",
                    Confidence = (decimal)(result?.Confidence ?? 0.0),
                    ProcessingTimeMs = result?.ProcessingTimeMs ?? 0,
                    DetectedAt = DateTime.UtcNow
                };
            }
            catch (Exception ex)
            {
                // In case Python service is down, log or handle gracefully
                Console.WriteLine($"ANPR Service Error: {ex.Message}");
                return new AnprResult
                {
                    PlateNumber = "",
                    Confidence = 0,
                    DetectedAt = DateTime.UtcNow
                };
            }
        }

        private class AnprResponseDto
        {
            public string PlateNumber { get; set; } = string.Empty;
            public double Confidence { get; set; }
            public int ProcessingTimeMs { get; set; }
        }
    }
}
