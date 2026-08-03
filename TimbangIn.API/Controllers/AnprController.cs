using AutoMapper;
using Microsoft.AspNetCore.Hosting;
using Microsoft.AspNetCore.Http;
using Microsoft.AspNetCore.Mvc;
using System;
using System.IO;
using System.Linq;
using System.Threading.Tasks;
using TimbangIn.Application.DTOs.Master;
using TimbangIn.Application.Interfaces;
using TimbangIn.Application.Utils;
using TimbangIn.Domain.Entities;
using TimbangIn.Domain.Interfaces;

namespace TimbangIn.API.Controllers
{
    [ApiController]
    [Route("api/[controller]")]
    public class AnprController : ControllerBase
    {
        private readonly IAnprService _anprService;
        private readonly ITruckMasterService _truckMasterService;
        private readonly IGenericRepository<AnprDetectionLog> _anprLogRepository;
        private readonly IWebHostEnvironment _env;
        private readonly IMapper _mapper;

        public AnprController(
            IAnprService anprService, 
            ITruckMasterService truckMasterService,
            IGenericRepository<AnprDetectionLog> anprLogRepository,
            IWebHostEnvironment env,
            IMapper mapper)
        {
            _anprService = anprService;
            _truckMasterService = truckMasterService;
            _anprLogRepository = anprLogRepository;
            _env = env;
            _mapper = mapper;
        }

        [HttpPost("detect")]
        public async Task<IActionResult> DetectPlate(IFormFile image)
        {
            if (image == null || image.Length == 0)
                return BadRequest(new { success = false, message = "No image uploaded." });

            // 1. Read image bytes
            byte[] imageBytes;
            using (var memoryStream = new MemoryStream())
            {
                await image.CopyToAsync(memoryStream);
                imageBytes = memoryStream.ToArray();
            }

            // 2. Save snapshot to wwwroot/anpr-captures
            var captureFolder = Path.Combine(_env.WebRootPath ?? Path.Combine(Directory.GetCurrentDirectory(), "wwwroot"), "anpr-captures");
            if (!Directory.Exists(captureFolder))
                Directory.CreateDirectory(captureFolder);

            var fileName = $"{DateTime.UtcNow:yyyyMMdd_HHmmssfff}.jpg";
            var filePath = Path.Combine(captureFolder, fileName);
            var relativeUrl = $"/anpr-captures/{fileName}";

            await System.IO.File.WriteAllBytesAsync(filePath, imageBytes);

            // 3. Call Python ANPR Service
            var anprResult = await _anprService.DetectPlateAsync(imageBytes, image.FileName);
            anprResult.ImageUrl = relativeUrl;

            // 4. Match with TruckMaster if plate was detected
            if (!string.IsNullOrEmpty(anprResult.PlateNumber))
            {
                var matchedTruck = await _truckMasterService.GetByPlateNumberAsync(anprResult.PlateNumber);

                if (matchedTruck != null)
                {
                    anprResult.IsMatched = true;
                    anprResult.TruckId = matchedTruck.Id;
                    anprResult.MatchedTruck = matchedTruck;
                }
            }

            // 5. Log detection
            var logEntry = new AnprDetectionLog
            {
                PlateNumber = anprResult.PlateNumber,
                Confidence = anprResult.Confidence,
                ImagePath = relativeUrl,
                IsMatched = anprResult.IsMatched,
                TruckId = anprResult.TruckId,
                DetectedAt = anprResult.DetectedAt
            };
            
            await _anprLogRepository.AddAsync(logEntry);

            return Ok(new { success = true, data = anprResult });
        }
    }
}
