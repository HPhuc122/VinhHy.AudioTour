using AutoMapper;
using Microsoft.Extensions.Hosting;
using VinhHy.NarrationAPI.Application.Common;
using VinhHy.NarrationAPI.Application.Exceptions;
using VinhHy.NarrationAPI.Application.Features.Media.DTOs;
using VinhHy.NarrationAPI.Application.Interfaces;
using VinhHy.NarrationAPI.Application.Interfaces.Services;
using VinhHy.NarrationAPI.Domain.Entities;

namespace VinhHy.NarrationAPI.Infrastructure.Services;

public class MediaService : IMediaService
{
    private static readonly IReadOnlyDictionary<string, string> AllowedExtensions = new Dictionary<string, string>
    {
        [".jpg"] = "image",
        [".jpeg"] = "image",
        [".png"] = "image",
        [".webp"] = "image",
        [".mp3"] = "audio",
        [".wav"] = "audio",
        [".m4a"] = "audio"
    };

    private readonly IUnitOfWork _uow;
    private readonly IMapper _mapper;
    private readonly IHostEnvironment _environment;

    public MediaService(IUnitOfWork uow, IMapper mapper, IHostEnvironment environment)
    {
        _uow = uow;
        _mapper = mapper;
        _environment = environment;
    }

    public async Task<IReadOnlyList<MediaFileDto>> GetAllAsync(CancellationToken cancellationToken = default)
    {
        var items = await _uow.MediaFiles.GetAllAsync(cancellationToken).ConfigureAwait(false);
        return _mapper.Map<IReadOnlyList<MediaFileDto>>(items);
    }

    public async Task<PagedResult<MediaFileDto>> SearchAsync(
        MediaListRequest request,
        Func<string, string>? publicUrlFactory = null,
        CancellationToken cancellationToken = default)
    {
        var fileType = NormalizeFileType(request.FileType);
        var result = await _uow.MediaFiles.GetPagedAsync(
                request.NormalizedPage,
                request.NormalizedPageSize,
                request.Search,
                fileType,
                request.IncludeDeleted,
                cancellationToken)
            .ConfigureAwait(false);

        var items = _mapper.Map<IReadOnlyList<MediaFileDto>>(result.Items);
        if (publicUrlFactory is not null)
        {
            foreach (var item in items)
            {
                item.PublicUrl = publicUrlFactory(item.RelativePath);
            }
        }

        return PagedResult<MediaFileDto>.Create(
            items,
            request.NormalizedPage,
            request.NormalizedPageSize,
            result.TotalCount);
    }

    public async Task<MediaFileDto?> GetByIdAsync(int id, CancellationToken cancellationToken = default)
    {
        var mediaFile = await _uow.MediaFiles.GetByIdAsync(id, cancellationToken: cancellationToken).ConfigureAwait(false);
        return mediaFile is null ? null : _mapper.Map<MediaFileDto>(mediaFile);
    }

    public async Task<MediaFileDto> UploadAsync(
        UploadMediaRequest request,
        CancellationToken cancellationToken = default)
    {
        ValidateUpload(request);

        var extension = Path.GetExtension(request.OriginalFileName).ToLowerInvariant();
        var fileType = AllowedExtensions[extension];
        var folder = fileType == "image" ? "images" : "audio";
        var fileName = $"{Guid.NewGuid():N}{extension}";
        var relativePath = Path.Combine("uploads", folder, fileName).Replace('\\', '/');
        var uploadDirectory = Path.Combine(_environment.ContentRootPath, "uploads", folder);
        var absolutePath = Path.Combine(uploadDirectory, fileName);

        Directory.CreateDirectory(uploadDirectory);

        await using (var output = new FileStream(absolutePath, FileMode.CreateNew, FileAccess.Write, FileShare.None))
        {
            await request.FileContent.CopyToAsync(output, cancellationToken).ConfigureAwait(false);
        }

        var mediaFile = new MediaFile
        {
            FileName = fileName,
            OriginalFileName = Path.GetFileName(request.OriginalFileName),
            FileType = fileType,
            ContentType = string.IsNullOrWhiteSpace(request.ContentType)
                ? "application/octet-stream"
                : request.ContentType,
            FileSize = request.FileSize,
            RelativePath = relativePath,
            UploadedAt = DateTime.UtcNow,
            UploadedByUserId = request.UploadedByUserId,
            IsDeleted = false
        };

        await _uow.MediaFiles.AddAsync(mediaFile, cancellationToken).ConfigureAwait(false);
        await _uow.SaveChangesAsync(cancellationToken).ConfigureAwait(false);

        return _mapper.Map<MediaFileDto>(mediaFile);
    }

    public async Task DeleteAsync(int id, CancellationToken cancellationToken = default)
    {
        var mediaFile = await _uow.MediaFiles.GetByIdAsync(id, cancellationToken: cancellationToken).ConfigureAwait(false)
            ?? throw new NotFoundException(nameof(MediaFile), id);

        mediaFile.IsDeleted = true;
        _uow.MediaFiles.Update(mediaFile);
        await _uow.SaveChangesAsync(cancellationToken).ConfigureAwait(false);
    }

    public async Task RestoreAsync(int id, CancellationToken cancellationToken = default)
    {
        var mediaFile = await _uow.MediaFiles.GetByIdAsync(id, includeDeleted: true, cancellationToken).ConfigureAwait(false)
            ?? throw new NotFoundException(nameof(MediaFile), id);

        mediaFile.IsDeleted = false;
        _uow.MediaFiles.Update(mediaFile);
        await _uow.SaveChangesAsync(cancellationToken).ConfigureAwait(false);
    }

    private static string? NormalizeFileType(string? fileType)
    {
        if (string.IsNullOrWhiteSpace(fileType))
        {
            return null;
        }

        var normalized = fileType.Trim().ToLowerInvariant();
        if (normalized is not ("image" or "audio"))
        {
            throw new ValidationException(nameof(fileType), "File type must be image or audio.");
        }

        return normalized;
    }

    private static void ValidateUpload(UploadMediaRequest request)
    {
        if (request.FileContent is null)
        {
            throw new ValidationException(nameof(request.FileContent), "File is required.");
        }

        if (request.FileSize <= 0)
        {
            throw new ValidationException(nameof(request.FileSize), "File must not be empty.");
        }

        if (string.IsNullOrWhiteSpace(request.OriginalFileName))
        {
            throw new ValidationException(nameof(request.OriginalFileName), "Original file name is required.");
        }

        var extension = Path.GetExtension(request.OriginalFileName).ToLowerInvariant();
        if (!AllowedExtensions.ContainsKey(extension))
        {
            throw new ValidationException(
                nameof(request.OriginalFileName),
                "Allowed file extensions are jpg, jpeg, png, webp, mp3, wav, and m4a.");
        }
    }
}
