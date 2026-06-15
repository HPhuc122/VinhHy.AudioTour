# Image URL Resolution Fix — Frontend Static Asset Loading

## Overview

This document describes the fix for broken image loading (404 errors) in the React frontend when displaying POI images. The solution involves:

1. **Backend verification:** Ensuring `app.UseStaticFiles()` is configured in Program.cs
2. **Frontend utility:** Creating a helper function to prepend the backend base URL to relative image paths
3. **Component integration:** Updating PoiTable.tsx to use the asset URL builder

---

## Problem Analysis

### Why Images Were Broken

**Scenario:**
- Backend stores image at: `wwwroot/uploads/pois/guid-name.jpg`
- Database saves: `/uploads/pois/guid-name.jpg` (relative URL)
- React frontend runs on: `localhost:5173`
- Browser tries to fetch: `http://localhost:5173/uploads/pois/guid-name.jpg` ❌ (frontend port)
- Correct location: `http://localhost:5000/uploads/pois/guid-name.jpg` ✅ (backend port)

**Root Causes:**
1. Frontend doesn't know the backend base URL when constructing image paths
2. Browser defaults to current window location (frontend port) instead of backend port
3. Image src is relative and context-sensitive

---

## Solution Components

### 1. Backend: Static File Middleware ✅

**File:** `backend/VinhHyNarrationAPI/src/VinhHy.NarrationAPI.Api/Program.cs`

**Status:** Already configured ✅

```csharp
app.UseMiddleware<ExceptionHandlingMiddleware>();
app.UseCors("CmsPolicy");

app.UseStaticFiles();  // ← Enables serving files from wwwroot/

if (app.Environment.IsDevelopment())
{
	app.UseSwagger();
	// ...
}
```

**What this does:**
- Maps HTTP requests to physical files in `wwwroot/` directory
- Example: GET `/uploads/pois/guid.jpg` → serves `wwwroot/uploads/pois/guid.jpg`
- CORS policy (`CmsPolicy`) allows `localhost:5173` to access these files

**Middleware order matters:**
```
1. Exception handling (catch errors)
2. CORS (allow cross-origin)
3. Static files (serve public assets) ← HERE
4. Authentication (protect routes)
```

---

### 2. Frontend: Asset URL Utility

**File:** `web-admin/src/utils/assetUrl.ts`

```typescript
const BASE_URL = import.meta.env.VITE_API_BASE_URL ?? 'http://localhost:5000';

export const buildAssetUrl = (relativePath: string | null | undefined): string | null => {
  if (!relativePath) {
	return null;
  }

  // If already absolute, return as-is
  if (relativePath.startsWith('http://') || relativePath.startsWith('https://')) {
	return relativePath;
  }

  // Prepend backend base URL
  const normalizedPath = relativePath.startsWith('/') ? relativePath : `/${relativePath}`;
  return `${BASE_URL}${normalizedPath}`;
};

export const getAssetUrl = buildAssetUrl; // Alias
```

**How it works:**

| Input | Output |
|-------|--------|
| `/uploads/pois/guid.jpg` | `http://localhost:5000/uploads/pois/guid.jpg` |
| `uploads/pois/guid.jpg` | `http://localhost:5000/uploads/pois/guid.jpg` |
| `http://cdn.example.com/image.jpg` | `http://cdn.example.com/image.jpg` (unchanged) |
| `null` | `null` |
| `undefined` | `null` |

**Key features:**
- ✅ Reads `VITE_API_BASE_URL` from environment (dynamic)
- ✅ Defaults to `http://localhost:5000` for development
- ✅ Handles missing leading slash
- ✅ Skips modification if already absolute URL
- ✅ Safe null/undefined handling

---

### 3. Frontend: Component Integration

**File:** `web-admin/src/features/pois/components/PoiTable.tsx`

**Before:**
```typescript
import { Button } from '../../../components/ui/Button';
import usePois from '../hooks/usePois';
// ... other imports ...

export function PoiTable({ onEdit }: Props) {
  // ...
  {poi.imageUrl ? (
	<img src={poi.imageUrl} alt="POI" className="..." />  // ❌ Broken
  ) : (
	<span>Trống</span>
  )}
}
```

**After:**
```typescript
import { Button } from '../../../components/ui/Button';
import usePois from '../hooks/usePois';
// ... other imports ...
import { buildAssetUrl } from '../../../utils/assetUrl';  // ← NEW

export function PoiTable({ onEdit }: Props) {
  // ...
  {poi.imageUrl ? (
	<img src={buildAssetUrl(poi.imageUrl) || ''} alt="POI" className="..." />  // ✅ Fixed
  ) : (
	<span>Trống</span>
  )}
}
```

**What changed:**
1. Added import: `import { buildAssetUrl } from '../../../utils/assetUrl'}`
2. Wrapped image URL: `buildAssetUrl(poi.imageUrl)`
3. Added fallback: `|| ''` for TypeScript safety

---

## Environment Configuration

### Development

**File:** `.env` (or use .env.example)

```env
VITE_API_BASE_URL=http://localhost:5000
```

### Frontend runs on:**
- `http://localhost:5173`

### Backend runs on:**
- `http://localhost:5000`

### Image request flow:**
1. React renders: `<img src="...buildAssetUrl('/uploads/pois/guid.jpg')..." />`
2. buildAssetUrl returns: `http://localhost:5000/uploads/pois/guid.jpg`
3. Browser makes GET to backend: `http://localhost:5000/uploads/pois/guid.jpg`
4. Backend matches URL to file: `wwwroot/uploads/pois/guid.jpg`
5. UseStaticFiles middleware serves file ✅

### Production

**Example:** Deployed to `api.example.com`

```env
VITE_API_BASE_URL=https://api.example.com
```

**Image request flow:**
1. buildAssetUrl returns: `https://api.example.com/uploads/pois/guid.jpg`
2. Browser fetches from production API domain ✅

---

## CORS Considerations

### Why CORS Matters for Static Assets

**Scenario:** Frontend at `localhost:5173`, backend at `localhost:5000`

This is a **cross-origin request** (different ports = different origins):

```
Origin: http://localhost:5173
Request to: http://localhost:5000/uploads/pois/guid.jpg
```

**Browser security blocks this unless backend explicitly allows it.**

### Current CORS Configuration

**File:** `backend/VinhHyNarrationAPI/src/VinhHy.NarrationAPI.Api/Program.cs`

```csharp
builder.Services.AddCors(options =>
{
	options.AddPolicy("CmsPolicy", policy =>
		policy.WithOrigins("http://localhost:5173")  // Allow frontend
			.AllowAnyHeader()
			.AllowAnyMethod());
});

// Later in middleware pipeline:
app.UseCors("CmsPolicy");
```

This allows `localhost:5173` to:
- ✅ Fetch API responses
- ✅ Load static files (images)
- ✅ Send custom headers
- ✅ Use any HTTP method (GET, POST, PUT, DELETE, etc.)

---

## Testing the Fix

### Step 1: Verify Backend

```bash
# Test if static files are being served
curl http://localhost:5000/uploads/pois/[guid-name].jpg

# Response should be:
# - HTTP 200 (if file exists)
# - Image binary data
# OR
# - HTTP 404 (if file doesn't exist)
```

### Step 2: Check Environment Variable

```typescript
// Open browser console in React app
console.log(import.meta.env.VITE_API_BASE_URL);
// Should output: http://localhost:5000 (or production URL)
```

### Step 3: Test buildAssetUrl

```typescript
// In browser console
import { buildAssetUrl } from './utils/assetUrl';

buildAssetUrl('/uploads/pois/example.jpg');
// Should output: http://localhost:5000/uploads/pois/example.jpg
```

### Step 4: Check Image in DOM

```typescript
// React DevTools or browser inspector
// Find <img> element in PoiTable
// Right-click → Inspect Element
// Check src attribute

// Should be:
src="http://localhost:5000/uploads/pois/guid.jpg"

// NOT:
src="/uploads/pois/guid.jpg"  // ❌ This uses localhost:5173
```

### Step 5: Network Tab

Open DevTools → Network tab

**Create or update a POI with image:**
1. API returns: `{ imageUrl: "/uploads/pois/guid.jpg" }`
2. PoiTable renders with buildAssetUrl → `src="http://localhost:5000/uploads/pois/guid.jpg"`
3. Network tab shows GET request to backend
4. Image loads successfully ✅

---

## Usage in Other Components

If you need to display images in other components:

```typescript
// In any React component
import { buildAssetUrl } from '../path/to/utils/assetUrl';

// Avatar
<img src={buildAssetUrl(user.avatarUrl)} />

// Product thumbnail
<img src={buildAssetUrl(product.thumbUrl)} />

// POI detail view
<img src={buildAssetUrl(poi.imageUrl)} className="w-full h-96 object-cover" />
```

**Anywhere you have a relative URL from the backend, wrap it with `buildAssetUrl()`**

---

## Troubleshooting

### Issue: Images still showing 404

**Diagnostics:**
1. Open DevTools → Network tab
2. Look at the image request URL
3. Is it going to the correct backend URL?

**Solution:**
- Check `.env` file has correct `VITE_API_BASE_URL`
- Verify backend is running on the correct port
- Reload React app (Vite might cache env)

```bash
# Kill Vite dev server
# Clear browser cache (Ctrl+Shift+Delete)
# Restart: npm run dev
```

### Issue: "CORS error"

**Error message:** "Access to XMLHttpRequest has been blocked by CORS policy"

**Solutions:**
1. Check backend CORS policy includes `http://localhost:5173`
2. Verify `app.UseCors("CmsPolicy")` is called before `app.MapControllers()`
3. Restart backend server

### Issue: Images load locally but not in production

**Cause:** Environment variable not set in production

**Solution:**
```bash
# Before deploying, set environment variable
export VITE_API_BASE_URL=https://api.yourdomain.com

# Or in deployment platform (GitHub Actions, Docker, etc.)
VITE_API_BASE_URL=https://api.yourdomain.com
```

```typescript
// In CI/CD pipeline
npm run build  // Will use VITE_API_BASE_URL from environment
```

---

## Files Changed Summary

| File | Change | Type |
|------|--------|------|
| `backend/.../Program.cs` | Already has `app.UseStaticFiles()` | No change needed ✅ |
| `web-admin/src/utils/assetUrl.ts` | NEW utility function | Created |
| `web-admin/src/features/pois/components/PoiTable.tsx` | Import utility + use in `<img>` | Modified |

---

## Related Documentation

- [Image Upload Implementation](./IMAGE_UPLOAD_IMPLEMENTATION.md)
- [ASP.NET Core Static Files](https://learn.microsoft.com/en-us/aspnet/core/fundamentals/static-files)
- [Vite Environment Variables](https://vitejs.dev/guide/env-and-mode.html)
- [CORS in ASP.NET Core](https://learn.microsoft.com/en-us/aspnet/core/security/cors)

---

## Architecture Compliance

✅ **Utility pattern:** Reusable logic in dedicated utility file
✅ **Environment-aware:** Uses VITE_API_BASE_URL for flexibility
✅ **Type-safe:** Handles null/undefined gracefully
✅ **DRY principle:** Single source of truth for asset URL building
✅ **No hardcoding:** Supports any backend domain (dev/prod)
✅ **React best practices:** No side effects, pure function

---
