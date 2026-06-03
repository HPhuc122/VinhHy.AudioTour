# VinhHy Narration API — Sample Requests

Base URL (development): `https://localhost:7022` or `http://localhost:5082`

All successful responses use the `ApiResponse` envelope:

```json
{
  "success": true,
  "message": "Success",
  "data": { }
}
```

## Login

**Request**

```http
POST /api/v1/auth/login
Content-Type: application/json

{
  "username": "admin",
  "password": "ChangeMe123!"
}
```

**Response** `200 OK`

```json
{
  "success": true,
  "message": "Login successful",
  "data": {
    "accessToken": "eyJhbGciOiJIUzI1NiIsInR5cCI6IkpXVCJ9...",
    "refreshToken": "base64-refresh-token",
    "expiresAtUtc": "2026-05-22T12:00:00Z",
    "userId": 1,
    "username": "admin",
    "role": "SuperAdmin"
  }
}
```

Use the access token for protected endpoints:

```http
Authorization: Bearer eyJhbGciOiJIUzI1NiIsInR5cCI6IkpXVCJ9...
```

## POI list (paged)

**Request**

```http
GET /api/v1/pois?page=1&pageSize=20&search=beach&isActive=true
Authorization: Bearer {accessToken}
```

**Response** `200 OK`

```json
{
  "success": true,
  "message": "Success",
  "data": {
    "items": [
      {
        "id": 1,
        "code": "VH-001",
        "latitude": 11.75,
        "longitude": 109.18,
        "radiusMeters": 30,
        "priority": 1,
        "isActive": true,
        "category": "landmark",
        "version": 1
      }
    ],
    "page": 1,
    "pageSize": 20,
    "totalCount": 1,
    "totalPages": 1
  }
}
```

## Sync pull

**Request**

```http
POST /api/v1/sync/pull
Content-Type: application/json
Authorization: Bearer {accessToken}

{
  "since": "2026-05-01T00:00:00Z",
  "deviceId": "device-abc-123",
  "entityTypes": ["pois", "poiTranslations", "audioTracks", "tours"]
}
```

**Response** `200 OK`

```json
{
  "success": true,
  "message": "Success",
  "data": {
    "serverTimestamp": "2026-05-22T08:30:00Z",
    "pois": [],
    "poiTranslations": [],
    "audioTracks": [],
    "tours": [],
    "tourTranslations": [],
    "qrLocations": [],
    "languages": [],
    "offlinePackages": [],
    "deletedRecords": []
  }
}
```

## Validation error example

**Response** `400 Bad Request`

```json
{
  "success": false,
  "message": "One or more validation errors occurred.",
  "errors": {
    "Username": ["Username is required."]
  }
}
```
