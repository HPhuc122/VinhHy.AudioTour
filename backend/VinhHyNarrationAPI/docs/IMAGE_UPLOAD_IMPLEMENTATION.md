# Image Upload Implementation — POI Module

## Overview

This document describes the image upload functionality implemented for the POI (Point of Interest) module. The solution handles file uploads from the React frontend, saves them to the local `wwwroot/uploads/pois` directory, and stores the relative URL in the SQL Server database.

---

## Architecture & Components

### 1. IFileUploadService (Application Layer)

**File:** `VinhHy.NarrationAPI.Application/Interfaces/Services/IFileUploadService.cs`

Defines the contract for file upload operations:

```csharp
Task<string> SaveFileAsync(IFormFile file, string uploadDirectory, 
	CancellationToken cancellationToken = default);

bool DeleteFile(string relativeUrl);
```

**Responsibility:** Domain-independent file handling interface.

---

### 2. FileUploadService (Infrastructure Layer)

**File:** `VinhHy.NarrationAPI.Infrastructure/Services/FileUploadService.cs`

Implements concrete file upload logic with these features:

#### File Validation
- **Size limit:** 5 MB (configurable via `MaxFileSizeBytes`)
- **Allowed types:** `.jpg`, `.jpeg`, `.png`, `.gif`, `.webp`
- **MIME type check:** Validation against declared content type

#### File Handling
- **Directory creation:** Automatically creates `wwwroot/uploads/pois/` if missing
- **Unique naming:** Uses `Guid.NewGuid()` + original extension
- **Example:** `e3d8a9c2-1f4b-4e7c-a2b3-1c9d5f8e2a1b.jpg`

#### Security & Logging
- **Path traversal protection:** Validates resolved path is within wwwroot
- **Structured logging:** Uses ILogger for audit trail
- **Error handling:** Catches IO exceptions and logs appropriately

---

### 3. PoiService Updates

**File:** `VinhHy.NarrationAPI.Infrastructure/Services/PoiService.cs`

#### CreateAsync Method
```csharp
public async Task<PoiDto> CreateAsync(CreatePoiRequest request, CancellationToken cancellationToken)
{
	// Validate POI Code uniqueness

	// Check if image is provided and not empty
	string? imageUrl = null;
	if (request.Image is not null && request.Image.Length > 0)
	{
		// Save file to wwwroot/uploads/pois
		imageUrl = await _fileUploadService.SaveFileAsync(
			request.Image, 
			PoiUploadDirectory, 
			cancellationToken);
	}

	// Create POI entity and assign imageUrl
	var poi = _mapper.Map<Poi>(request);
	poi.ImageUrl = imageUrl;  // ← Sets relative URL or null

	// Persist to database
	await _uow.Pois.AddAsync(poi, cancellationToken);
	await _uow.SaveChangesAsync(cancellationToken);

	return _mapper.Map<PoiDto>(poi);
}
```

#### UpdateAsync Method
```csharp
// Handle image file update if provided
if (request.Image is not null && request.Image.Length > 0)
{
	// Delete old image if it exists
	if (!string.IsNullOrWhiteSpace(poi.ImageUrl))
	{
		_fileUploadService.DeleteFile(poi.ImageUrl);
	}

	// Upload new image
	poi.ImageUrl = await _fileUploadService.SaveFileAsync(
		request.Image, 
		PoiUploadDirectory, 
		cancellationToken);
}
else if (request.ImageUrl is not null)
{
	// Only update if explicitly provided
	poi.ImageUrl = request.ImageUrl;
}
```

**Key Logic:**
1. **Null checks:** `request.Image is not null && request.Image.Length > 0`
2. **File upload:** Delegates to `IFileUploadService`
3. **URL assignment:** Directly assign relative URL to `poi.ImageUrl`
4. **Old file cleanup:** On update, deletes old image before uploading new one

---

### 4. DTO Updates

#### CreatePoiRequest
```csharp
public class CreatePoiRequest
{
	public string Code { get; set; }
	public decimal Latitude { get; set; }
	public decimal Longitude { get; set; }
	public decimal RadiusMeters { get; set; } = 30;
	public int Priority { get; set; } = 1;
	public bool IsActive { get; set; } = true;

	public IFormFile? Image { get; set; }  // ← NEW

	public string? Category { get; set; }
	public int CooldownSeconds { get; set; } = 300;
	public int MinDwellSeconds { get; set; } = 5;
}
```

#### UpdatePoiRequest
```csharp
public class UpdatePoiRequest
{
	public decimal? Latitude { get; set; }
	// ... other nullable properties ...

	public IFormFile? Image { get; set; }  // ← NEW
	public string? ImageUrl { get; set; }  // Kept for manual URL assignment
}
```

---

### 5. DI Registration

**File:** `VinhHy.NarrationAPI.Infrastructure/DependencyInjection/InfrastructureServiceCollectionExtensions.cs`

```csharp
services.AddScoped<IFileUploadService, FileUploadService>();
```

Added to `RegisterServices()` method alongside other services.

---

### 6. Static File Serving

**File:** `VinhHy.NarrationAPI.Api/Program.cs`

```csharp
app.UseMiddleware<ExceptionHandlingMiddleware>();
app.UseCors("CmsPolicy");

app.UseStaticFiles();  // ← NEW: Enables serving files from wwwroot

if (app.Environment.IsDevelopment())
{
	app.UseSwagger();
	// ...
}
```

**Purpose:** Allows browsers to access uploaded files at URLs like `/uploads/pois/guid.jpg`.

---

## Usage Flow

### Create POI with Image

**React Frontend:**
```typescript
const formData = new FormData();
formData.append("code", "POI001");
formData.append("latitude", 10.5);
formData.append("longitude", 105.5);
formData.append("image", imageFile);  // File object from input

const response = await fetch("/api/v1/pois", {
  method: "POST",
  body: formData,
  headers: {
	"Authorization": `Bearer ${token}`
  }
});
```

**Backend Flow:**
1. `PoisController.Create()` receives `[FromForm] CreatePoiRequest`
2. Request includes `IFormFile? Image`
3. `PoiService.CreateAsync()` calls validation
4. If image exists: `SaveFileAsync()` creates file, returns `/uploads/pois/guid.jpg`
5. Assign URL to `poi.ImageUrl`
6. Save POI to database with stored `ImageUrl` (not null)

**Response:**
```json
{
  "success": true,
  "message": "POI created",
  "data": {
	"id": 1,
	"code": "POI001",
	"latitude": 10.5,
	"longitude": 105.5,
	"imageUrl": "/uploads/pois/e3d8a9c2-1f4b-4e7c-a2b3-1c9d5f8e2a1b.jpg"
  }
}
```

**Image Access:**
- Frontend can now fetch: `{API_BASE}/uploads/pois/e3d8a9c2-1f4b-4e7c-a2b3-1c9d5f8e2a1b.jpg`
- HTTP GET returns the image file

---

## File Storage Structure

```
wwwroot/
├── uploads/
│   └── pois/
│       ├── e3d8a9c2-1f4b-4e7c-a2b3-1c9d5f8e2a1b.jpg
│       ├── a1b2c3d4-5e6f-7a8b-9c0d-1e2f3a4b5c6d.png
│       └── ...other images...
└── ...other static files...
```

---

## Error Handling

### Validation Exceptions

**Empty file:**
```
ValidationException: "File is empty or not provided."
```

**File too large:**
```
ValidationException: "File size exceeds maximum allowed size of 5 MB."
```

**Invalid file type:**
```
ValidationException: "File type '.docx' is not allowed. Allowed types: .jpg, .jpeg, .png, .gif, .webp"
```

**MIME type mismatch:**
- Logged as warning but allowed (some browsers report different MIME types)

### Response (Error Case)

```json
{
  "success": false,
  "message": "Validation failed",
  "errors": [
	{
	  "field": "image",
	  "message": "File type '.docx' is not allowed. Allowed types: .jpg, .jpeg, .png, .gif, .webp"
	}
  ]
}
```

---

## Configuration

### Max File Size

To adjust the maximum file size, edit `FileUploadService.cs`:

```csharp
private const long MaxFileSizeBytes = 5 * 1024 * 1024; // Change this value
```

### Allowed Formats

To add/remove allowed file types, modify `AllowedExtensions` dictionary:

```csharp
private static readonly Dictionary<string, string> AllowedExtensions = new(StringComparer.OrdinalIgnoreCase)
{
	{ ".jpg", "image/jpeg" },
	{ ".jpeg", "image/jpeg" },
	{ ".png", "image/png" },
	{ ".gif", "image/gif" },
	{ ".webp", "image/webp" },
	// Add more types here if needed
};
```

---

## Architecture Compliance

✅ **Service Layer Pattern:** File handling isolated in dedicated service
✅ **Async/Await:** All I/O operations use async methods
✅ **Dependency Injection:** IFileUploadService registered in DI container
✅ **Repository Pattern:** PoiService uses IUnitOfWork (existing pattern)
✅ **DTOs:** File data passed via request DTOs
✅ **Structured Logging:** Operations logged via ILogger<FileUploadService>
✅ **Clean Architecture:** Separation of concerns between layers
✅ **No business logic in controller:** Controller delegates to service
✅ **Security:** Path traversal protection, file validation

---

## Testing Recommendations

### Unit Tests
- Test `FileUploadService.SaveFileAsync()` with valid/invalid files
- Test max file size validation
- Test allowed extension validation
- Test file deletion

### Integration Tests
- Test POI creation with image upload
- Test POI update with new image (old file cleanup)
- Test without image (ImageUrl should be null)
- Verify file exists on disk at returned relative URL
- Verify static file serving middleware returns file

### Manual Testing
1. Access Swagger: `http://localhost:5000/swagger`
2. POST to `/api/v1/pois` with FormData containing image
3. Verify response contains `imageUrl`
4. Navigate to returned image URL in browser
5. Confirm image displays correctly

---

## Future Enhancements

1. **Image Optimization:** Compress uploaded images before storage
2. **CDN Integration:** Store files in Azure Blob Storage or AWS S3
3. **Thumbnail Generation:** Auto-generate thumbnails for list views
4. **Rate Limiting:** Limit uploads per user per time period
5. **Virus Scanning:** Integrate antivirus scanning service
6. **Image Metadata:** Extract EXIF data for additional information

---
