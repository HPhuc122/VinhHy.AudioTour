using Microsoft.AspNetCore.Http;
using Microsoft.AspNetCore.Hosting;

namespace VinhHy.NarrationAPI.Application.Interfaces.Services;

/// <summary>
/// Service for handling file uploads to the server.
/// </summary>
public interface IFileUploadService
{
    /// <summary>
    /// Saves a file to the specified directory and returns the relative URL.
    /// </summary>
    /// <param name="file">The file to upload.</param>
    /// <param name="uploadDirectory">The relative directory from wwwroot (e.g., "uploads/pois").</param>
    /// <param name="cancellationToken">Cancellation token.</param>
    /// <returns>The relative URL of the uploaded file (e.g., "/uploads/pois/guid-name.jpg").</returns>
    Task<string> SaveFileAsync(IFormFile file, string uploadDirectory, CancellationToken cancellationToken = default);

    /// <summary>
    /// Deletes a file from the server.
    /// </summary>
    /// <param name="relativeUrl">The relative URL of the file (e.g., "/uploads/pois/guid-name.jpg").</param>
    /// <returns>True if the file was deleted, false if it didn't exist.</returns>
    bool DeleteFile(string relativeUrl);
}
