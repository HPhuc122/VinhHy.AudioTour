using Microsoft.AspNetCore.Http;
using Microsoft.AspNetCore.Hosting;
using Microsoft.Extensions.Logging;
using VinhHy.NarrationAPI.Application.Exceptions;
using VinhHy.NarrationAPI.Application.Interfaces.Services;

namespace VinhHy.NarrationAPI.Infrastructure.Services;

public class FileUploadService : IFileUploadService
{
    private readonly IWebHostEnvironment _hostEnvironment;
    private readonly ILogger<FileUploadService> _logger;

    // Allowed file extensions and their MIME types
    private static readonly Dictionary<string, string> AllowedExtensions = new(StringComparer.OrdinalIgnoreCase)
    {
        { ".jpg", "image/jpeg" },
        { ".jpeg", "image/jpeg" },
        { ".png", "image/png" },
        { ".gif", "image/gif" },
        { ".webp", "image/webp" }
    };

    private const long MaxFileSizeBytes = 5 * 1024 * 1024; // 5 MB

    public FileUploadService(IWebHostEnvironment hostEnvironment, ILogger<FileUploadService> logger)
    {
        _hostEnvironment = hostEnvironment;
        _logger = logger;
    }

    public async Task<string> SaveFileAsync(IFormFile file, string uploadDirectory, CancellationToken cancellationToken = default)
    {
        // Validate file
        if (file == null || file.Length == 0)
        {
            throw new ValidationException(nameof(file), "File is empty or not provided.");
        }

        if (file.Length > MaxFileSizeBytes)
        {
            throw new ValidationException(nameof(file), $"File size exceeds maximum allowed size of {MaxFileSizeBytes / (1024 * 1024)} MB.");
        }

        // Validate file extension
        var extension = Path.GetExtension(file.FileName).ToLowerInvariant();
        if (!AllowedExtensions.ContainsKey(extension))
        {
            throw new ValidationException(nameof(file), $"File type '{extension}' is not allowed. Allowed types: {string.Join(", ", AllowedExtensions.Keys)}");
        }

        // Validate MIME type
        if (!AllowedExtensions[extension].Equals(file.ContentType, StringComparison.OrdinalIgnoreCase))
        {
            _logger.LogWarning("MIME type mismatch for file {FileName}: declared as {DeclaredType}, expected {ExpectedType}",
                file.FileName, file.ContentType, AllowedExtensions[extension]);
            throw new ValidationException(nameof(file), "File MIME type does not match extension.");
        }

        try
        {
            // Build the full directory path
            var webRootPath = _hostEnvironment.WebRootPath ?? Path.Combine(Directory.GetCurrentDirectory(), "wwwroot");
            var fullDirectoryPath = Path.Combine(webRootPath, uploadDirectory);

            // Create directory if it doesn't exist
            if (!Directory.Exists(fullDirectoryPath))
            {
                Directory.CreateDirectory(fullDirectoryPath);
                _logger.LogInformation("Created upload directory: {DirectoryPath}", fullDirectoryPath);
            }

            // Generate unique filename using Guid
            var filename = $"{Guid.NewGuid()}{extension}";
            var fullFilePath = Path.Combine(fullDirectoryPath, filename);

            // Save the file
            await using (var stream = new FileStream(fullFilePath, FileMode.Create, FileAccess.Write, FileShare.None))
            {
                await file.CopyToAsync(stream, cancellationToken).ConfigureAwait(false);
            }

            // Return relative URL
            var relativeUrl = $"/{uploadDirectory}/{filename}";
            _logger.LogInformation("File uploaded successfully: {RelativeUrl}", relativeUrl);

            return relativeUrl;
        }
        catch (IOException ex)
        {
            _logger.LogError(ex, "IO error while uploading file {FileName}", file.FileName);
            throw new InvalidOperationException($"Failed to save file: {ex.Message}", ex);
        }
        catch (Exception ex)
        {
            _logger.LogError(ex, "Unexpected error while uploading file {FileName}", file.FileName);
            throw;
        }
    }

    public bool DeleteFile(string relativeUrl)
    {
        try
        {
            if (string.IsNullOrWhiteSpace(relativeUrl))
            {
                return false;
            }

            var webRootPath = _hostEnvironment.WebRootPath ?? Path.Combine(Directory.GetCurrentDirectory(), "wwwroot");

            // Remove leading slash if present
            var relativePath = relativeUrl.TrimStart('/');
            var fullFilePath = Path.Combine(webRootPath, relativePath);

            // Security check: ensure the resolved path is within wwwroot
            var resolvedPath = Path.GetFullPath(fullFilePath);
            var resolvedWebRoot = Path.GetFullPath(webRootPath);
            if (!resolvedPath.StartsWith(resolvedWebRoot, StringComparison.OrdinalIgnoreCase))
            {
                _logger.LogWarning("Attempted to delete file outside wwwroot: {FilePath}", relativeUrl);
                return false;
            }

            if (File.Exists(fullFilePath))
            {
                File.Delete(fullFilePath);
                _logger.LogInformation("File deleted: {RelativeUrl}", relativeUrl);
                return true;
            }

            return false;
        }
        catch (Exception ex)
        {
            _logger.LogError(ex, "Error deleting file {RelativeUrl}", relativeUrl);
            return false;
        }
    }
}
