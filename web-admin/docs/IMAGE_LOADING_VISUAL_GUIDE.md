# 🖼️ Image Loading Fix - Visual Diagram

## Architecture Diagram

```
┌─────────────────────────────────────────────────────────────────────────┐
│                          FRONTEND (React)                               │
│                    localhost:5173                                       │
│                                                                         │
│  ┌──────────────────────────────────────────────────────────────────┐  │
│  │ PoiTable.tsx                                                     │  │
│  │                                                                  │  │
│  │ import { buildAssetUrl } from '../../../utils/assetUrl'        │  │
│  │                                                                  │  │
│  │ const poi = {                                                   │  │
│  │   id: 1,                                                         │  │
│  │   code: "POI001",                                               │  │
│  │   imageUrl: "/uploads/pois/abc123.jpg"  ← API returns this    │  │
│  │ }                                                                │  │
│  │                                                                  │  │
│  │ <img src={buildAssetUrl(poi.imageUrl)} />  ← Uses utility      │  │
│  └──────────────────────────────────────────────────────────────────┘  │
│                           ▼                                              │
│  ┌──────────────────────────────────────────────────────────────────┐  │
│  │ utils/assetUrl.ts - buildAssetUrl()                            │  │
│  │                                                                  │  │
│  │ Input:  "/uploads/pois/abc123.jpg"                             │  │
│  │                                                                  │  │
│  │ BASE_URL = import.meta.env.VITE_API_BASE_URL                  │  │
│  │          ?? 'http://localhost:5000'                            │  │
│  │                                                                  │  │
│  │ Output: "http://localhost:5000/uploads/pois/abc123.jpg"       │  │
│  └──────────────────────────────────────────────────────────────────┘  │
│                           ▼                                              │
│  ┌──────────────────────────────────────────────────────────────────┐  │
│  │ <img src="http://localhost:5000/uploads/pois/abc123.jpg" />    │  │
│  │        ▼ (Browser makes cross-origin request)                   │  │
└──────────────────────────────────────────────────────────────────────────┘
								 ▼
┌─────────────────────────────────────────────────────────────────────────┐
│                         BACKEND (ASP.NET)                               │
│                    localhost:5000                                       │
│                                                                         │
│  ┌──────────────────────────────────────────────────────────────────┐  │
│  │ Middleware Pipeline                                              │  │
│  │                                                                  │  │
│  │ 1. ExceptionHandling ────┐                                      │  │
│  │ 2. CORS                  │ ──► GET /uploads/pois/abc123.jpg    │  │
│  │ 3. ✅ UseStaticFiles() ┘                                       │  │
│  │ 4. Authentication                                               │  │
│  │ 5. Controllers (API)                                            │  │
│  └──────────────────────────────────────────────────────────────────┘  │
│                           ▼                                              │
│  ┌──────────────────────────────────────────────────────────────────┐  │
│  │ UseStaticFiles Middleware                                        │  │
│  │                                                                  │  │
│  │ URL: /uploads/pois/abc123.jpg                                   │  │
│  │ ↓                                                                │  │
│  │ File Path: wwwroot/uploads/pois/abc123.jpg                     │  │
│  │ ↓                                                                │  │
│  │ File.Exists? ✅ YES                                            │  │
│  │ ↓                                                                │  │
│  │ Return HTTP 200 + File Binary                                   │  │
│  └──────────────────────────────────────────────────────────────────┘  │
│                           ▼                                              │
└─────────────────────────────────────────────────────────────────────────┘
								 ▼
┌─────────────────────────────────────────────────────────────────────────┐
│ Browser receives image → <img> tag displays ✅                          │
└─────────────────────────────────────────────────────────────────────────┘
```

---

## Request Flow Timeline

```
Time    Component              Action
────    ─────────────────────  ──────────────────────────────────────
T+0     API Response           POST /api/v1/pois returns:
							   { imageUrl: "/uploads/pois/abc123.jpg" }

T+1     React Component        PoiTable receives data
							   poi.imageUrl = "/uploads/pois/abc123.jpg"

T+2     buildAssetUrl()        Reads VITE_API_BASE_URL = "http://localhost:5000"
							   Builds: "http://localhost:5000/uploads/pois/abc123.jpg"

T+3     React Render           <img src="http://localhost:5000/uploads/pois/abc123.jpg" />

T+4     Browser Request        GET http://localhost:5000/uploads/pois/abc123.jpg
							   (Cross-origin request to backend)

T+5     CORS Middleware        ✅ Allows localhost:5173 → localhost:5000

T+6     UseStaticFiles         Maps URL to file: wwwroot/uploads/pois/abc123.jpg

T+7     File System            File.Exists(path) ✅ TRUE

T+8     HTTP Response          HTTP 200 + Image Binary Data

T+9     Browser                <img> receives data stream
							   Renders image ✅

T+10    User Screen            👁️ Image visible!
```

---

## Before & After Comparison

### ❌ BEFORE (Broken)

```
React Component:
<img src={poi.imageUrl} />
					▼
<img src="/uploads/pois/abc123.jpg" />
					▼
Browser URL Resolution:
Current Window: http://localhost:5173
Resolved URL: http://localhost:5173/uploads/pois/abc123.jpg
					▼
GET http://localhost:5173/uploads/pois/abc123.jpg
					▼
404 Not Found ❌ (Frontend doesn't have this file)
```

### ✅ AFTER (Fixed)

```
React Component:
import { buildAssetUrl } from '../utils/assetUrl'
<img src={buildAssetUrl(poi.imageUrl)} />
					▼
<img src="http://localhost:5000/uploads/pois/abc123.jpg" />
					▼
Browser URL is absolute:
Resolved URL: http://localhost:5000/uploads/pois/abc123.jpg (uses this directly)
					▼
GET http://localhost:5000/uploads/pois/abc123.jpg
					▼
200 OK ✅ (Backend serves from wwwroot)
					▼
Image Displays! 🎉
```

---

## Environment Variable Resolution

```
Development Mode:
┌─────────────────────────────────────────┐
│ .env file                               │
│ VITE_API_BASE_URL=http://localhost:5000 │
└─────────────────────────────────────────┘
		  │
		  ▼
┌─────────────────────────────────────────┐
│ buildAssetUrl utility                   │
│ const BASE_URL = import.meta.env        │
│   .VITE_API_BASE_URL                    │
│ const BASE_URL = "http://localhost:5000"│
└─────────────────────────────────────────┘
		  │
		  ▼
┌─────────────────────────────────────────┐
│ Image URL Building                      │
│ "/uploads/pois/abc.jpg"                 │
│ + "http://localhost:5000"               │
│ = "http://localhost:5000/uploads/..."   │
└─────────────────────────────────────────┘


Production Mode:
┌──────────────────────────────────────────┐
│ Environment Variable (CI/CD)             │
│ VITE_API_BASE_URL=https://api.example.com│
└──────────────────────────────────────────┘
		  │
		  ▼
┌──────────────────────────────────────────┐
│ buildAssetUrl utility                    │
│ const BASE_URL = import.meta.env         │
│   .VITE_API_BASE_URL                     │
│ const BASE_URL = "https://api.example.com"
└──────────────────────────────────────────┘
		  │
		  ▼
┌──────────────────────────────────────────┐
│ Image URL Building                       │
│ "/uploads/pois/abc.jpg"                  │
│ + "https://api.example.com"              │
│ = "https://api.example.com/uploads/..."  │
└──────────────────────────────────────────┘
```

---

## CORS Flow

```
Frontend (localhost:5173)
		  │
		  │ OPTIONS /uploads/pois/abc.jpg
		  ├─ Origin: http://localhost:5173
		  ▼
	Backend (localhost:5000)
		  │
		  │ CORS Middleware Check:
		  │ "Is origin in allowed list?"
		  │ ✅ YES: http://localhost:5173 is in CmsPolicy
		  │
		  ▼ Add CORS Headers
	Access-Control-Allow-Origin: http://localhost:5173
	Access-Control-Allow-Methods: GET, POST, PUT, DELETE
	Access-Control-Allow-Headers: *
		  │
		  ▼
Frontend receives headers
		  ✅ Browser allows image fetch!
		  │
		  ▼ GET /uploads/pois/abc.jpg
	Backend UseStaticFiles
		  ✅ Serves file
		  │
		  ▼ Image data
	Browser displays image
```

---

## File Change Map

```
web-admin/
├── .env
│   └── VITE_API_BASE_URL=http://localhost:5000 ✅ (already exists)
│
├── src/
│   │
│   ├── utils/
│   │   └── assetUrl.ts ✨ NEW FILE
│   │       └── buildAssetUrl() function
│   │
│   ├── features/pois/
│   │   └── components/
│   │       └── PoiTable.tsx ✏️ MODIFIED
│   │           ├── import { buildAssetUrl }
│   │           └── <img src={buildAssetUrl(...)} />
│   │
│   └── docs/
│       ├── FRONTEND_IMAGE_LOADING.md 📖 NEW
│       ├── ASSET_URL_QUICK_REFERENCE.md 📖 NEW
│       └── IMAGE_LOADING_FIX_SUMMARY.md 📖 NEW
│
backend/
└── VinhHyNarrationAPI/.../
	└── Program.cs ✅ ALREADY HAS
		└── app.UseStaticFiles();
```

---

## State Diagram: Image Loading States

```
┌─────────────────────────────────────────────────────────────┐
│ POI Created with Image Upload                               │
└─────────────────────────────────────────────────────────────┘
		  │
		  ▼
┌─────────────────────────────────────────────────────────────┐
│ Backend: SaveFileAsync()                                     │
│ ✅ File saved to: wwwroot/uploads/pois/abc123.jpg          │
│ ✅ Returns: /uploads/pois/abc123.jpg                        │
└─────────────────────────────────────────────────────────────┘
		  │
		  ▼
┌─────────────────────────────────────────────────────────────┐
│ Database: POI persisted                                      │
│ ✅ ImageUrl = "/uploads/pois/abc123.jpg"                   │
└─────────────────────────────────────────────────────────────┘
		  │
		  ▼
┌─────────────────────────────────────────────────────────────┐
│ API Response                                                 │
│ ✅ { id: 1, imageUrl: "/uploads/pois/abc123.jpg", ... }   │
└─────────────────────────────────────────────────────────────┘
		  │
		  ▼
┌─────────────────────────────────────────────────────────────┐
│ Frontend: Received                                           │
│ ✅ poi.imageUrl = "/uploads/pois/abc123.jpg"               │
└─────────────────────────────────────────────────────────────┘
		  │
		  ▼
┌─────────────────────────────────────────────────────────────┐
│ PoiTable.tsx: Render                                        │
│ ❌ OLD: <img src={poi.imageUrl} />                          │
│        Tries: localhost:5173/uploads/pois/abc123.jpg → 404  │
│                                                              │
│ ✅ NEW: <img src={buildAssetUrl(poi.imageUrl)} />          │
│        Tries: localhost:5000/uploads/pois/abc123.jpg → 200  │
└─────────────────────────────────────────────────────────────┘
		  │
		  ▼
┌─────────────────────────────────────────────────────────────┐
│ Backend: Serve Static File                                   │
│ ✅ UseStaticFiles middleware                                │
│ ✅ Maps: /uploads/pois/abc123.jpg → wwwroot/.../abc123.jpg│
│ ✅ File.Exists? YES                                        │
│ ✅ Returns: HTTP 200 + Binary Data                         │
└─────────────────────────────────────────────────────────────┘
		  │
		  ▼
┌─────────────────────────────────────────────────────────────┐
│ Browser: Display Image                                       │
│ ✅ <img> receives image data                                │
│ ✅ Renders on screen                                        │
│                                                              │
│ 👁️ User sees the image!                                    │
└─────────────────────────────────────────────────────────────┘
```

---

## Utility Function Logic Flow

```
buildAssetUrl(relativePath)
	  │
	  ├─ if (!relativePath) → return null ✅
	  │
	  ├─ if (starts with http:// OR https://) → return as-is ✅
	  │     (Already absolute URL)
	  │
	  ├─ const normalizedPath = 
	  │     (starts with /) ? path : "/" + path
	  │
	  └─ return `${BASE_URL}${normalizedPath}` ✅
			│
			└─ Example: http://localhost:5000 + /uploads/pois/abc.jpg
					  = http://localhost:5000/uploads/pois/abc.jpg
```

---

## Success Indicators ✅

After implementing the fix, you should see:

```
1. Browser DevTools → Network Tab
   ├─ Image requests going to http://localhost:5000/uploads/... ✅
   ├─ Status: 200 OK ✅
   └─ Content-Type: image/jpeg (or png, etc.) ✅

2. Browser DevTools → Elements Tab
   ├─ <img> src="http://localhost:5000/uploads/pois/..." ✅
   └─ Image renders without broken icon ✅

3. React DevTools → PoiTable Component
   ├─ poi.imageUrl = "/uploads/pois/abc123.jpg" ✅
   ├─ buildAssetUrl(poi.imageUrl) called ✅
   └─ Result: "http://localhost:5000/uploads/pois/abc123.jpg" ✅

4. User Interface
   ├─ PoiTable shows images ✅
   ├─ No broken image icons ✅
   └─ Images render correctly ✅
```

---

## Key Takeaway

```
┌────────────────────────────────────────────────────┐
│  Relative URL from API    Utility Function         │
│  ┌──────────────────┐    ┌──────────────────────┐  │
│  │ /uploads/pois/   │ ──→ │ buildAssetUrl()     │  │
│  │  abc123.jpg      │    │  + BASE_URL         │  │
│  └──────────────────┘    └──────────────────────┘  │
│                                 │                   │
│                                 ▼                   │
│                         Absolute URL               │
│                    ┌────────────────────────┐      │
│                    │ http://localhost:5000/ │      │
│                    │ uploads/pois/abc123.jpg│      │
│                    └────────────────────────┘      │
│                                 │                   │
│                                 ▼                   │
│                    Browser Fetches = Success! ✅  │
└────────────────────────────────────────────────────┘
```

---
