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
  "uploadedAt": "2026-06-08T10:00:00Z",
  "uploadedByUserId": 1,
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

Returns non-deleted media files.

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
