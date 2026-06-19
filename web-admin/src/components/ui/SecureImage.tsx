import { useEffect, useState, type ImgHTMLAttributes, type ReactNode } from 'react';
import { useAuth } from '@/features/auth/context/AuthContext';
import { isCmsProtectedAssetUrl } from '@/utils/assetUrl';

interface SecureImageProps extends Omit<ImgHTMLAttributes<HTMLImageElement>, 'src' | 'alt'> {
  src: string | null | undefined;
  alt: string;
  fallback?: ReactNode;
  placeholderClassName?: string;
}

export function SecureImage({
  src,
  alt,
  className,
  fallback,
  placeholderClassName,
  ...imgProps
}: SecureImageProps) {
  const { httpClient } = useAuth();
  const [objectUrl, setObjectUrl] = useState<string | null>(null);
  const [failed, setFailed] = useState(false);
  const needsAuthenticatedFetch = isCmsProtectedAssetUrl(src);

  useEffect(() => {
    setFailed(false);
    setObjectUrl(null);

    if (!src || !needsAuthenticatedFetch) {
      return;
    }

    let cancelled = false;
    let nextObjectUrl: string | null = null;

    httpClient
      .get<Blob>(src, {
        responseType: 'blob',
        headers: {
          Accept: 'image/*',
        },
      })
      .then((response) => {
        if (cancelled) {
          return;
        }

        nextObjectUrl = URL.createObjectURL(response.data);
        setObjectUrl(nextObjectUrl);
      })
      .catch((error) => {
        if (cancelled) {
          return;
        }

        setFailed(true);
        if (import.meta.env.DEV) {
          console.warn('Unable to load protected CMS image.', {
            src,
            status: error?.response?.status,
          });
        }
      });

    return () => {
      cancelled = true;
      if (nextObjectUrl) {
        URL.revokeObjectURL(nextObjectUrl);
      }
    };
  }, [httpClient, needsAuthenticatedFetch, src]);

  const resolvedSrc = needsAuthenticatedFetch ? objectUrl : src;

  if (!resolvedSrc || failed) {
    return (
      fallback ?? (
        <div
          role="img"
          aria-label={alt}
          className={[
            'flex items-center justify-center bg-gray-100 text-center text-xs text-gray-400',
            className,
            placeholderClassName,
          ].filter(Boolean).join(' ')}
        >
          {failed ? 'Không tải được ảnh' : ''}
        </div>
      )
    );
  }

  return <img src={resolvedSrc} alt={alt} className={className} {...imgProps} />;
}
