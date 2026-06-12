# Media API

Base route: `/api/v1/media`

All endpoints require a CMS content-management token.

All responses use the standard API envelope:

```json
{
  "success": true,
  "message": "Success",
  "data": {}
}
```

## Media File

```json
{
  "id": 1,
  "fileName": "7f6d2f8b3d6b40c4a4f7dce2b5d19b7d.jpg",
  "originalFileName": "vinh-hy.jpg",
  "fileType": "image",
  "contentType": "image/jpeg",
  "fileSize": 204800,
  "relativePath": "uploads/images/7f6d2f8b3d6b40c4a4f7dce2b5d19b7d.jpg",
  "publicUrl": "https://localhost:7022/uploads/images/7f6d2f8b3d6b40c4a4f7dce2b5d19b7d.jpg",
  "uploadedAt": "2026-06-08T10:00:00Z",
  "uploadedByUserId": 1,
  "uploadedByUsername": "admin",
  "isDeleted": false
}
```

## Allowed Files

Images:

- `jpg`
- `jpeg`
- `png`
- `webp`

Audio:

- `mp3`
- `wav`
- `m4a`

Files are saved under:

- `uploads/images`
- `uploads/audio`

Stored filenames are GUID-based. Original filenames are preserved in metadata.

## List Media

```http
GET /api/v1/media
Authorization: Bearer {accessToken}
```

Returns a non-paged list of non-deleted media files. This endpoint is preserved for backward compatibility.

## Search Media

```http
GET /api/v1/media/search?page=1&pageSize=20&search=vinh&fileType=image&includeDeleted=false
Authorization: Bearer {accessToken}
```

Query parameters:

- `page`: page number, defaults to `1`
- `pageSize`: page size, defaults to `20`, max `100`
- `search`: optional search over stored file name and original file name
- `fileType`: optional `image` or `audio`
- `includeDeleted`: optional `true` or `false`

Returns a paged result:

```json
{
  "success": true,
  "message": "Success",
  "data": {
    "items": [
      {
        "id": 1,
        "fileName": "7f6d2f8b3d6b40c4a4f7dce2b5d19b7d.jpg",
        "originalFileName": "vinh-hy.jpg",
        "fileType": "image",
        "contentType": "image/jpeg",
        "fileSize": 204800,
        "relativePath": "uploads/images/7f6d2f8b3d6b40c4a4f7dce2b5d19b7d.jpg",
        "publicUrl": "https://localhost:7022/uploads/images/7f6d2f8b3d6b40c4a4f7dce2b5d19b7d.jpg",
        "uploadedAt": "2026-06-08T10:00:00Z",
        "uploadedByUserId": 1,
        "uploadedByUsername": "admin",
        "isDeleted": false
      }
    ],
    "page": 1,
    "pageSize": 20,
    "totalCount": 1,
    "totalPages": 1
  }
}
```

## Get Media By Id

```http
GET /api/v1/media/{id}
Authorization: Bearer {accessToken}
```

## Upload Media

```http
POST /api/v1/media/upload
Authorization: Bearer {accessToken}
Content-Type: multipart/form-data

file=@vinh-hy.jpg
```

The multipart field name must be `file`.

## Delete Media

```http
DELETE /api/v1/media/{id}
Authorization: Bearer {accessToken}
```

Deletes are logical deletes. The media row is marked with `isDeleted = true`; deleted files are omitted from list and detail responses.

## Restore Media

```http
POST /api/v1/media/{id}/restore
Authorization: Bearer {accessToken}
```

Restores a logically deleted media row by setting `isDeleted = false`.

## Static Media Files

The API serves uploaded files only from the `/uploads` request path. No other server directories are exposed for static file access.
