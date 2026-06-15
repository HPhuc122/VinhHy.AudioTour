# 🎯 Image Loading Fix Summary

## Problem ❌
Images uploaded to backend's `wwwroot/uploads/pois/` were showing 404 errors in React frontend because:
- Database stores: `/uploads/pois/guid.jpg` (relative URL)
- Frontend tries to fetch: `http://localhost:5173/uploads/pois/guid.jpg` (wrong port!)
- Correct location: `http://localhost:5000/uploads/pois/guid.jpg` (backend)

---

## Solution ✅

### Backend (Already Done ✅)
**File:** `backend/VinhHyNarrationAPI/src/VinhHy.NarrationAPI.Api/Program.cs`

```csharp
app.UseStaticFiles();  // ✅ Serves files from wwwroot/
```

This middleware allows the backend to serve static files at HTTP GET requests.

---

### Frontend - 2 Changes

#### 1️⃣ Create Asset URL Utility
**File:** `web-admin/src/utils/assetUrl.ts` (NEW ✨)

```typescript
const BASE_URL = import.meta.env.VITE_API_BASE_URL ?? 'http://localhost:5000';

export const buildAssetUrl = (relativePath: string | null | undefined): string | null => {
  if (!relativePath) return null;
  if (relativePath.startsWith('http://') || relativePath.startsWith('https://')) return relativePath;

  const normalizedPath = relativePath.startsWith('/') ? relativePath : `/${relativePath}`;
  return `${BASE_URL}${normalizedPath}`;
};
```

**What it does:**
- Takes relative URL from database: `/uploads/pois/guid.jpg`
- Prepends backend base URL: `http://localhost:5000`
- Returns complete URL: `http://localhost:5000/uploads/pois/guid.jpg`
- Reads environment variable for flexibility (dev vs production)

---

#### 2️⃣ Update PoiTable Component
**File:** `web-admin/src/features/pois/components/PoiTable.tsx` (MODIFIED ✏️)

**Before:**
```typescript
<img src={poi.imageUrl} alt="POI" />  // ❌ Broken
```

**After:**
```typescript
import { buildAssetUrl } from '../../../utils/assetUrl';  // ← ADD THIS

// ...

<img src={buildAssetUrl(poi.imageUrl) || ''} alt="POI" />  // ✅ Fixed
```

---

## How It Works (Flow)

```
1. Backend stores image:
   File: wwwroot/uploads/pois/abc123.jpg
   Database: { imageUrl: "/uploads/pois/abc123.jpg" }

2. API returns POI:
   { id: 1, code: "POI001", imageUrl: "/uploads/pois/abc123.jpg", ... }

3. React receives data:
   const poi = { imageUrl: "/uploads/pois/abc123.jpg" }

4. PoiTable renders image:
   <img src={buildAssetUrl(poi.imageUrl)} />  
   → buildAssetUrl("/uploads/pois/abc123.jpg")
   → "http://localhost:5000/uploads/pois/abc123.jpg"

5. Browser requests image from backend:
   GET http://localhost:5000/uploads/pois/abc123.jpg

6. Backend serves file:
   UseStaticFiles middleware finds: wwwroot/uploads/pois/abc123.jpg
   Returns file with HTTP 200 ✅

7. Image renders on screen! 🎉
```

---

## Environment Variables

### Development (`.env`)
```env
VITE_API_BASE_URL=http://localhost:5000
```

### Production (deployment)
```env
VITE_API_BASE_URL=https://api.yourdomain.com
```

The utility automatically reads this and uses it to build complete URLs.

---

## Testing

### ✅ Check 1: Backend Serves Files
```bash
curl http://localhost:5000/uploads/pois/[guid].jpg -I
# Should return HTTP 200 or 404 (not error)
```

### ✅ Check 2: Environment Variable Set
Open browser console:
```javascript
console.log(import.meta.env.VITE_API_BASE_URL);
// Output: http://localhost:5000
```

### ✅ Check 3: URL Builde Works
```javascript
import { buildAssetUrl } from './utils/assetUrl';
buildAssetUrl('/uploads/pois/test.jpg');
// Output: http://localhost:5000/uploads/pois/test.jpg
```

### ✅ Check 4: Image Loads in App
1. Create/edit POI with image
2. View in PoiTable
3. Right-click image → Inspect
4. Check `src` attribute includes `http://localhost:5000`
5. Network tab shows successful request ✅

---

## Files Created/Modified

| File | Status | What |
|------|--------|------|
| `backend/.../Program.cs` | ✅ Already done | `app.UseStaticFiles()` |
| `web-admin/src/utils/assetUrl.ts` | ✨ NEW | Utility function |
| `web-admin/src/features/pois/components/PoiTable.tsx` | ✏️ MODIFIED | Use utility |
| `web-admin/docs/FRONTEND_IMAGE_LOADING.md` | 📖 NEW | Full documentation |
| `web-admin/docs/ASSET_URL_QUICK_REFERENCE.md` | 📖 NEW | Quick reference |

---

## Next Steps (For Other Components)

Whenever you need to display images from the backend API:

```typescript
import { buildAssetUrl } from '../../../utils/assetUrl';

// Use it everywhere:
<img src={buildAssetUrl(data.imageUrl)} />
```

---

## Troubleshooting

### Images still broken?
1. Check `.env` has `VITE_API_BASE_URL=http://localhost:5000`
2. Restart React dev server: `npm run dev`
3. Verify backend running on port 5000
4. Clear browser cache

### CORS error?
- Backend CORS policy already allows `localhost:5173` ✅
- If changed, update `Program.cs` CorsPolicy

### Wrong URL generated?
- Check environment variable: `console.log(import.meta.env.VITE_API_BASE_URL)`
- Should match backend actual URL

---

## Architecture Compliance ✅

- **Service Layer:** Utility function for asset URL building (not inline)
- **Configuration:** Uses environment variables (not hardcoded)
- **Type Safety:** Handles null/undefined gracefully
- **DRY:** Reusable utility (not duplicated in components)
- **Separation of Concerns:** Backend serves, frontend requests

---

## Summary Checklist

- ✅ Backend: `app.UseStaticFiles()` configured
- ✅ Frontend: `buildAssetUrl` utility created
- ✅ Component: PoiTable updated to use utility
- ✅ Environment: `VITE_API_BASE_URL` configured
- ✅ CORS: Allows frontend to access static files
- ✅ Docs: Full documentation provided
- ✅ Testing: Steps provided for verification

## 🎉 Images Now Load Correctly!

Relative URLs from backend → Complete URLs with backend domain → Images fetch from correct port → Display in frontend! 

---

## Related Files

- `/backend/.../IMAGE_UPLOAD_IMPLEMENTATION.md` - How uploads work
- `/web-admin/docs/FRONTEND_IMAGE_LOADING.md` - Detailed explanation
- `/web-admin/docs/ASSET_URL_QUICK_REFERENCE.md` - Quick examples

---
