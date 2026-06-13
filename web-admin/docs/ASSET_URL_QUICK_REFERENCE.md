# Quick Reference: Using buildAssetUrl

## TL;DR (Too Long; Didn't Read)

When displaying images from backend API:

```typescript
import { buildAssetUrl } from '../../../utils/assetUrl';

// API returns: { imageUrl: "/uploads/pois/guid.jpg" }
<img src={buildAssetUrl(poi.imageUrl) || ''} alt="POI" />

// Result: <img src="http://localhost:5000/uploads/pois/guid.jpg" alt="POI" />
```

---

## Common Patterns

### Pattern 1: Display POI Image in Table
```typescript
import { buildAssetUrl } from '../../../utils/assetUrl';

<td>
  {poi.imageUrl ? (
	<img src={buildAssetUrl(poi.imageUrl) || ''} alt="POI" className="w-16 h-16 object-cover" />
  ) : (
	<span>No image</span>
  )}
</td>
```

### Pattern 2: Full-Size Image Detail Page
```typescript
import { buildAssetUrl } from '../../../utils/assetUrl';

export function PoiDetail({ poi }) {
  return (
	<div>
	  <h1>{poi.code}</h1>
	  {poi.imageUrl && (
		<img src={buildAssetUrl(poi.imageUrl)} alt="Detail view" className="w-full h-auto" />
	  )}
	</div>
  );
}
```

### Pattern 3: Avatar / Thumbnail Gallery
```typescript
import { buildAssetUrl } from '../../utils/assetUrl';

<div className="grid gap-4">
  {pois.map(poi => (
	<div key={poi.id}>
	  <img 
		src={buildAssetUrl(poi.imageUrl) || '/placeholder.jpg'} 
		alt={poi.code}
		onError={(e) => e.currentTarget.src = '/placeholder.jpg'}
	  />
	</div>
  ))}
</div>
```

### Pattern 4: With Loading State
```typescript
import { buildAssetUrl } from '../../../utils/assetUrl';
import { useState } from 'react';

export function PoiCard({ poi }) {
  const [isLoading, setIsLoading] = useState(true);

  return (
	<div>
	  {poi.imageUrl && (
		<div className="relative">
		  {isLoading && <div className="spinner">Loading...</div>}
		  <img 
			src={buildAssetUrl(poi.imageUrl) || ''} 
			alt="POI"
			onLoad={() => setIsLoading(false)}
			onError={() => setIsLoading(false)}
		  />
		</div>
	  )}
	</div>
  );
}
```

---

## Do's and Don'ts

### ✅ DO:
```typescript
// Use buildAssetUrl for all API image URLs
<img src={buildAssetUrl(poi.imageUrl)} />

// Handle null gracefully
<img src={buildAssetUrl(poi.imageUrl) || '/fallback.jpg'} />

// Use fallback images
onError={(e) => e.currentTarget.src = '/placeholder.jpg'}

// Check before rendering
{poi.imageUrl && <img src={buildAssetUrl(poi.imageUrl)} />}
```

### ❌ DON'T:
```typescript
// Don't use relative URLs directly
<img src={poi.imageUrl} />  // ❌ Will look on localhost:5173

// Don't hardcode base URL
<img src={`http://localhost:5000${poi.imageUrl}`} />  // ❌ Won't work in production

// Don't forget fallback
<img src={buildAssetUrl(poi.imageUrl)} />  // ❌ Could crash if null
```

---

## Environment Setup

### Local Development
```env
# .env
VITE_API_BASE_URL=http://localhost:5000
```

### Production
```env
# .env.production or deployment platform
VITE_API_BASE_URL=https://api.yourdomain.com
```

### Verify Configuration
```typescript
// In browser console
console.log(import.meta.env.VITE_API_BASE_URL);
```

---

## Debugging Broken Images

### Step 1: Check URL in DevTools
```typescript
// Browser Console
import { buildAssetUrl } from './utils/assetUrl';
buildAssetUrl('/uploads/pois/abc123.jpg');
// Should output: http://localhost:5000/uploads/pois/abc123.jpg
```

### Step 2: Test Backend
```bash
curl http://localhost:5000/uploads/pois/abc123.jpg -I
# Should return HTTP 200 (or 404 if file doesn't exist)
```

### Step 3: Check Network Tab
DevTools → Network → Look for image requests
- Should see request going to `http://localhost:5000/...`
- Check response headers for CORS issues

---

## Import Path Reference

| Location | Import Path |
|----------|------------|
| pois/components | `../../../utils/assetUrl` |
| pois/hooks | `../../utils/assetUrl` |
| auth/api | `../../utils/assetUrl` |
| components/ui | `../utils/assetUrl` |
| root src | `./utils/assetUrl` |

---

## Full Example: Complete POI Image Display

```typescript
import React, { useState } from 'react';
import { buildAssetUrl } from '../../../utils/assetUrl';

interface PoiImageDisplayProps {
  imageUrl?: string;
  altText?: string;
  className?: string;
  fallbackUrl?: string;
  onLoad?: () => void;
  onError?: () => void;
}

export function PoiImageDisplay({
  imageUrl,
  altText = 'POI Image',
  className = 'w-full h-auto object-cover',
  fallbackUrl = '/images/placeholder.jpg',
  onLoad,
  onError,
}: PoiImageDisplayProps) {
  const [isLoading, setIsLoading] = useState(!!imageUrl);
  const [hasError, setHasError] = useState(false);

  // If no image and no fallback, show nothing
  if (!imageUrl && !fallbackUrl) {
	return <div className="text-gray-400">No image</div>;
  }

  const displayUrl = buildAssetUrl(imageUrl) || fallbackUrl;

  return (
	<div className="relative overflow-hidden bg-gray-100">
	  {isLoading && (
		<div className="absolute inset-0 flex items-center justify-center">
		  <div className="animate-spin">⏳</div>
		</div>
	  )}

	  <img
		src={displayUrl}
		alt={altText}
		className={className}
		onLoad={() => {
		  setIsLoading(false);
		  setHasError(false);
		  onLoad?.();
		}}
		onError={() => {
		  setIsLoading(false);
		  setHasError(true);
		  onError?.();
		}}
	  />

	  {hasError && (
		<div className="absolute inset-0 flex items-center justify-center bg-gray-200">
		  <span className="text-gray-500">Failed to load image</span>
		</div>
	  )}
	</div>
  );
}
```

---

## Summary

1. **Import** buildAssetUrl from `../../../utils/assetUrl`
2. **Wrap** image URLs: `buildAssetUrl(poi.imageUrl)`
3. **Add fallback** for null values: `|| ''` or `|| '/fallback.jpg'`
4. **Test** by checking DevTools Network tab
5. **Debug** by verifying VITE_API_BASE_URL in console

✅ Images will now load from backend!
