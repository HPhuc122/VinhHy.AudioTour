import { useMemo, useRef, useState, type ChangeEvent } from 'react';
import { ApiClientError } from '@/api/apiError';
import { Alert } from '@/components/ui/Alert';
import { Button } from '@/components/ui/Button';
import { Input } from '@/components/ui/Input';
import { Modal } from '@/components/ui/Modal';
import { Select } from '@/components/ui/Select';
import {
  getMediaUrl,
  type MediaFileDto,
  type MediaFilterType,
} from '@/features/media/api/mediaApi';
import { useDeleteMediaMutation } from '@/features/media/hooks/useDeleteMediaMutation';
import { useMediaQuery } from '@/features/media/hooks/useMediaQuery';
import { useRestoreMediaMutation } from '@/features/media/hooks/useRestoreMediaMutation';
import { useUploadMediaMutation } from '@/features/media/hooks/useUploadMediaMutation';

const PAGE_SIZE = 20;
const imageAccept = '.jpg,.jpeg,.png,.webp,image/jpeg,image/png,image/webp';
const audioAccept = '.mp3,.wav,.m4a,audio/mpeg,audio/wav,audio/x-wav,audio/mp4';

export function MediaLibraryPage() {
  const [search, setSearch] = useState('');
  const [fileType, setFileType] = useState<MediaFilterType>('all');
  const [includeDeleted, setIncludeDeleted] = useState(false);
  const [page, setPage] = useState(1);
  const [previewMedia, setPreviewMedia] = useState<MediaFileDto | null>(null);
  const [notice, setNotice] = useState<string | null>(null);

  const imageInputRef = useRef<HTMLInputElement | null>(null);
  const audioInputRef = useRef<HTMLInputElement | null>(null);

  const filter = useMemo(
    () => ({
      page,
      pageSize: PAGE_SIZE,
      search: search.trim() || undefined,
      fileType,
      includeDeleted,
    }),
    [fileType, includeDeleted, page, search],
  );

  const mediaQuery = useMediaQuery(filter);
  const uploadMutation = useUploadMediaMutation();
  const deleteMutation = useDeleteMediaMutation();
  const restoreMutation = useRestoreMediaMutation();

  const mediaItems = mediaQuery.data?.items ?? [];
  const totalPages = mediaQuery.data?.totalPages ?? 0;
  const busyMutationId = getBusyMutationId(deleteMutation.variables, restoreMutation.variables);

  const handleUpload = (event: ChangeEvent<HTMLInputElement>) => {
    const file = event.target.files?.[0];
    event.target.value = '';

    if (!file) {
      return;
    }

    setNotice(null);
    uploadMutation.mutate(file, {
      onSuccess: () => {
        setPage(1);
        setNotice('Media file uploaded.');
      },
    });
  };

  const handleDelete = (media: MediaFileDto) => {
    const confirmed = window.confirm(`Delete ${media.originalFileName}?`);
    if (!confirmed) {
      return;
    }

    setNotice(null);
    deleteMutation.mutate(media.id, {
      onSuccess: () => setNotice('Media file deleted.'),
    });
  };

  const handleRestore = (media: MediaFileDto) => {
    setNotice(null);
    restoreMutation.mutate(media.id, {
      onSuccess: () => setNotice('Media file restored.'),
    });
  };

  const handleCopy = async (media: MediaFileDto) => {
    await navigator.clipboard.writeText(getMediaUrl(media));
    setNotice('Media URL copied.');
  };

  const queryError = getErrorMessage(mediaQuery.error, 'Unable to load media files.');
  const uploadError = getErrorMessage(uploadMutation.error, 'Unable to upload media file.');
  const deleteError = getErrorMessage(deleteMutation.error, 'Unable to delete media file.');
  const restoreError = getErrorMessage(restoreMutation.error, 'Unable to restore media file.');

  return (
    <section className="app-page">
      <div className="app-page-header">
        <div>
          <h1 className="app-title">Media Library</h1>
          <p className="app-subtitle">Manage reusable image and audio assets.</p>
        </div>
        <div className="flex flex-wrap gap-2">
          <input
            ref={imageInputRef}
            type="file"
            accept={imageAccept}
            className="hidden"
            onChange={handleUpload}
          />
          <input
            ref={audioInputRef}
            type="file"
            accept={audioAccept}
            className="hidden"
            onChange={handleUpload}
          />
          <Button
            variant="secondary"
            onClick={() => imageInputRef.current?.click()}
            isLoading={uploadMutation.isPending}
          >
            Upload image
          </Button>
          <Button onClick={() => audioInputRef.current?.click()} isLoading={uploadMutation.isPending}>
            Upload audio
          </Button>
        </div>
      </div>

      <div className="rounded-xl bg-white shadow-sm border border-gray-100 grid gap-3 p-4 sm:grid-cols-[1fr_180px_auto] sm:items-end">
        <Input
          id="media-search"
          label="Search"
          placeholder="File name or original name"
          value={search}
          onChange={(event) => {
            setSearch(event.target.value);
            setPage(1);
          }}
        />
        <Select
          id="media-type-filter"
          label="Type"
          value={fileType}
          onChange={(event) => {
            setFileType(event.target.value as MediaFilterType);
            setPage(1);
          }}
          options={[
            { value: 'all', label: 'All' },
            { value: 'image', label: 'Images' },
            { value: 'audio', label: 'Audio' },
          ]}
        />
        <label className="flex items-center gap-2 rounded-md border border-gray-100 bg-white px-3 py-2 text-sm text-gray-600">
          <input
            type="checkbox"
            checked={includeDeleted}
            onChange={(event) => {
              setIncludeDeleted(event.target.checked);
              setPage(1);
            }}
          />
          Include deleted
        </label>
      </div>

      {notice ? <Alert message={notice} /> : null}
      {queryError ? <Alert variant="error" message={queryError} /> : null}
      {uploadError ? <Alert variant="error" message={uploadError} /> : null}
      {deleteError ? <Alert variant="error" message={deleteError} /> : null}
      {restoreError ? <Alert variant="error" message={restoreError} /> : null}

      <MediaTable
        mediaItems={mediaItems}
        isLoading={mediaQuery.isLoading}
        busyMutationId={busyMutationId}
        onPreview={setPreviewMedia}
        onCopy={handleCopy}
        onDelete={handleDelete}
        onRestore={handleRestore}
      />

      <div className="flex items-center justify-between text-sm text-gray-600">
        <span>
          {mediaQuery.data ? `${mediaQuery.data.totalCount} media files` : 'Loading media files'}
        </span>
        <div className="flex items-center gap-2">
          <Button
            variant="secondary"
            size="sm"
            disabled={page <= 1}
            onClick={() => setPage((current) => Math.max(1, current - 1))}
          >
            Previous
          </Button>
          <span>
            Page {page} of {Math.max(1, totalPages)}
          </span>
          <Button
            variant="secondary"
            size="sm"
            disabled={totalPages === 0 || page >= totalPages}
            onClick={() => setPage((current) => current + 1)}
          >
            Next
          </Button>
        </div>
      </div>

      <MediaPreviewModal media={previewMedia} onClose={() => setPreviewMedia(null)} />
    </section>
  );
}

interface MediaTableProps {
  mediaItems: MediaFileDto[];
  isLoading: boolean;
  busyMutationId: number | null;
  onPreview: (media: MediaFileDto) => void;
  onCopy: (media: MediaFileDto) => void;
  onDelete: (media: MediaFileDto) => void;
  onRestore: (media: MediaFileDto) => void;
}

function MediaTable({
  mediaItems,
  isLoading,
  busyMutationId,
  onPreview,
  onCopy,
  onDelete,
  onRestore,
}: MediaTableProps) {
  return (
    <div className="rounded-xl bg-white shadow-sm border border-gray-100 overflow-hidden">
      <div className="overflow-x-auto">
        <table className="min-w-full divide-y divide-gray-100 text-sm">
          <thead className="bg-gray-50 text-gray-500 text-left text-xs font-semibold uppercase">
            <tr>
              <th className="px-4 py-3">File Name</th>
              <th className="px-4 py-3">Original Name</th>
              <th className="px-4 py-3">File Type</th>
              <th className="px-4 py-3">Size</th>
              <th className="px-4 py-3">Uploaded Date</th>
              <th className="px-4 py-3">Uploaded By</th>
              <th className="px-4 py-3 text-right">Actions</th>
            </tr>
          </thead>
          <tbody className="divide-y divide-gray-100">
            {isLoading ? (
              <tr>
                <td className="px-4 py-6 text-center text-gray-600" colSpan={7}>
                  Loading media files...
                </td>
              </tr>
            ) : null}
            {!isLoading && mediaItems.length === 0 ? (
              <tr>
                <td className="px-4 py-6 text-center text-gray-600" colSpan={7}>
                  No media files found.
                </td>
              </tr>
            ) : null}
            {mediaItems.map((media) => (
              <tr key={media.id} className={media.isDeleted ? 'bg-red-50/40' : undefined}>
                <td className="max-w-[220px] truncate px-4 py-3 font-medium text-gray-900">
                  {media.fileName}
                </td>
                <td className="max-w-[220px] truncate px-4 py-3 text-gray-600">
                  {media.originalFileName}
                </td>
                <td className="px-4 py-3">
                  <span className="rounded-full bg-gray-50 px-2 py-1 text-xs font-medium capitalize text-gray-600">
                    {media.fileType}
                  </span>
                  {media.isDeleted ? (
                    <span className="ml-2 rounded-full bg-red-100 px-2 py-1 text-xs font-medium text-red-700">
                      Deleted
                    </span>
                  ) : null}
                </td>
                <td className="px-4 py-3 text-gray-600">{formatBytes(media.fileSize)}</td>
                <td className="px-4 py-3 text-gray-600">{formatDate(media.uploadedAt)}</td>
                <td className="px-4 py-3 text-gray-600">
                  {media.uploadedByUsername ?? media.uploadedByUserId ?? '-'}
                </td>
                <td className="px-4 py-3">
                  <div className="flex flex-wrap justify-end gap-2">
                    <Button variant="ghost" size="sm" onClick={() => onPreview(media)}>
                      Preview
                    </Button>
                    <Button variant="ghost" size="sm" onClick={() => onCopy(media)}>
                      Copy URL
                    </Button>
                    {media.isDeleted ? (
                      <Button
                        variant="secondary"
                        size="sm"
                        isLoading={busyMutationId === media.id}
                        onClick={() => onRestore(media)}
                      >
                        Restore
                      </Button>
                    ) : (
                      <Button
                        variant="danger"
                        size="sm"
                        isLoading={busyMutationId === media.id}
                        onClick={() => onDelete(media)}
                      >
                        Delete
                      </Button>
                    )}
                  </div>
                </td>
              </tr>
            ))}
          </tbody>
        </table>
      </div>
    </div>
  );
}

function MediaPreviewModal({
  media,
  onClose,
}: {
  media: MediaFileDto | null;
  onClose: () => void;
}) {
  return (
    <Modal open={Boolean(media)} onClose={onClose} title={media?.originalFileName ?? 'Preview'}>
      {media?.fileType === 'image' ? (
        <img
          src={getMediaUrl(media)}
          alt={media.originalFileName}
          className="max-h-[70vh] w-full rounded-md object-contain"
        />
      ) : null}
      {media?.fileType === 'audio' ? (
        <audio src={getMediaUrl(media)} controls className="w-full">
          Audio preview is not supported by this browser.
        </audio>
      ) : null}
    </Modal>
  );
}

function getBusyMutationId(deleteId: unknown, restoreId: unknown): number | null {
  if (typeof deleteId === 'number') {
    return deleteId;
  }

  return typeof restoreId === 'number' ? restoreId : null;
}

function formatBytes(bytes: number): string {
  if (bytes < 1024) {
    return `${bytes} B`;
  }

  if (bytes < 1024 * 1024) {
    return `${(bytes / 1024).toFixed(1)} KB`;
  }

  return `${(bytes / (1024 * 1024)).toFixed(1)} MB`;
}

function formatDate(value: string): string {
  return new Intl.DateTimeFormat(undefined, {
    year: 'numeric',
    month: 'short',
    day: '2-digit',
    hour: '2-digit',
    minute: '2-digit',
  }).format(new Date(value));
}

function getErrorMessage(error: unknown, fallback: string): string | null {
  if (!error) {
    return null;
  }

  if (error instanceof ApiClientError) {
    return error.message;
  }

  return fallback;
}
