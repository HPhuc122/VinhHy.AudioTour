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

const languageOptions = [
  { value: 'vi', label: 'Tiếng Việt' },
  { value: 'en', label: 'English' },
  { value: 'zh', label: '中文' },
  { value: 'ko', label: '한국어' },
  { value: 'ja', label: '日本語' },
  { value: 'fr', label: 'Français' },
];

const voiceOptions = [
  { value: 'female-north', label: 'Nữ miền Bắc' },
  { value: 'female-south', label: 'Nữ miền Nam' },
  { value: 'male-north', label: 'Nam miền Bắc' },
  { value: 'male-south', label: 'Nam miền Nam' },
];

export function MediaLibraryPage() {
  const [search, setSearch] = useState('');
  const [fileType, setFileType] = useState<MediaFilterType>('all');
  const [includeDeleted, setIncludeDeleted] = useState(false);
  const [page, setPage] = useState(1);
  const [previewMedia, setPreviewMedia] = useState<MediaFileDto | null>(null);
  const [notice, setNotice] = useState<string | null>(null);
  const [narrationTitle, setNarrationTitle] = useState('');
  const [narrationLanguage, setNarrationLanguage] = useState('vi');
  const [narrationText, setNarrationText] = useState('');
  const [narrationVoice, setNarrationVoice] = useState('female-south');

  const imageInputRef = useRef<HTMLInputElement | null>(null);

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

  const handleUploadImages = async (event: ChangeEvent<HTMLInputElement>) => {
    const files = Array.from(event.target.files ?? []);
    event.target.value = '';

    if (files.length === 0) {
      return;
    }

    setNotice(null);

    try {
      for (const file of files) {
        await uploadMutation.mutateAsync(file);
      }

      setPage(1);
      setNotice(`Đã tải lên ${files.length} ảnh.`);
    } catch {
      setNotice(null);
    }
  };

  const handleDelete = (media: MediaFileDto) => {
    const confirmed = window.confirm(`Xóa ${media.originalFileName}?`);
    if (!confirmed) {
      return;
    }

    setNotice(null);
    deleteMutation.mutate(media.id, {
      onSuccess: () => setNotice('Đã xóa media.'),
    });
  };

  const handleRestore = (media: MediaFileDto) => {
    setNotice(null);
    restoreMutation.mutate(media.id, {
      onSuccess: () => setNotice('Đã khôi phục media.'),
    });
  };

  const handleCopy = async (media: MediaFileDto) => {
    await navigator.clipboard.writeText(getMediaUrl(media));
    setNotice('Đã sao chép URL media.');
  };

  const queryError = getErrorMessage(mediaQuery.error, 'Không thể tải thư viện media.');
  const uploadError = getErrorMessage(uploadMutation.error, 'Không thể tải ảnh lên.');
  const deleteError = getErrorMessage(deleteMutation.error, 'Không thể xóa media.');
  const restoreError = getErrorMessage(restoreMutation.error, 'Không thể khôi phục media.');

  return (
    <section className="app-page">
      <div className="app-page-header">
        <div>
          <h1 className="app-title">Thư viện media</h1>
          <p className="app-subtitle">Quản lý hình ảnh và chuẩn bị nội dung thuyết minh.</p>
        </div>
        <div className="flex flex-wrap gap-2">
          <input
            ref={imageInputRef}
            type="file"
            accept={imageAccept}
            multiple
            className="hidden"
            onChange={handleUploadImages}
          />
          <Button
            variant="secondary"
            onClick={() => imageInputRef.current?.click()}
            isLoading={uploadMutation.isPending}
          >
            Tải nhiều ảnh
          </Button>
        </div>
      </div>

      <div className="rounded-xl border border-gray-100 bg-white p-4 shadow-sm">
        <div className="mb-4">
          <h2 className="text-base font-semibold text-gray-900">Bản nháp thuyết minh</h2>
          <p className="text-sm text-gray-500">
            Chuẩn bị nội dung để kết nối quy trình Text-to-Speech ở bước sau.
          </p>
        </div>
        <div className="grid gap-4 lg:grid-cols-2">
          <Input
            id="narration-title"
            label="Tiêu đề"
            value={narrationTitle}
            onChange={(event) => setNarrationTitle(event.target.value)}
          />
          <Select
            id="narration-language"
            label="Ngôn ngữ"
            value={narrationLanguage}
            options={languageOptions}
            onChange={(event) => setNarrationLanguage(event.target.value)}
          />
          <div className="lg:col-span-2">
            <label htmlFor="narration-text" className="mb-1 block text-sm font-medium text-gray-700">
              Nội dung thuyết minh
            </label>
            <textarea
              id="narration-text"
              rows={5}
              value={narrationText}
              onChange={(event) => setNarrationText(event.target.value)}
              className="w-full rounded-md border border-gray-300 px-3 py-2 text-sm shadow-sm transition-colors focus:border-blue-500 focus:outline-none focus:ring-2 focus:ring-blue-500"
            />
          </div>
          <Select
            id="narration-voice"
            label="Giọng đọc"
            value={narrationVoice}
            options={voiceOptions}
            onChange={(event) => setNarrationVoice(event.target.value)}
          />
          <div className="flex items-end">
            <Button type="button" disabled title="Chưa kết nối TTS">
              Tạo âm thanh
            </Button>
            <span className="ml-3 text-sm text-gray-500">Chưa kết nối TTS</span>
          </div>
        </div>
      </div>

      <div className="rounded-xl bg-white shadow-sm border border-gray-100 grid gap-3 p-4 sm:grid-cols-[1fr_180px_auto] sm:items-end">
        <Input
          id="media-search"
          label="Tìm kiếm"
          placeholder="Tên file hoặc tên gốc"
          value={search}
          onChange={(event) => {
            setSearch(event.target.value);
            setPage(1);
          }}
        />
        <Select
          id="media-type-filter"
          label="Loại"
          value={fileType}
          onChange={(event) => {
            setFileType(event.target.value as MediaFilterType);
            setPage(1);
          }}
          options={[
            { value: 'all', label: 'Tất cả' },
            { value: 'image', label: 'Hình ảnh' },
            { value: 'audio', label: 'Âm thanh đã có' },
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
          Bao gồm đã xóa
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
          {mediaQuery.data ? `${mediaQuery.data.totalCount} media` : 'Đang tải media'}
        </span>
        <div className="flex items-center gap-2">
          <Button
            variant="secondary"
            size="sm"
            disabled={page <= 1}
            onClick={() => setPage((current) => Math.max(1, current - 1))}
          >
            Trước
          </Button>
          <span>
            Trang {page} / {Math.max(1, totalPages)}
          </span>
          <Button
            variant="secondary"
            size="sm"
            disabled={totalPages === 0 || page >= totalPages}
            onClick={() => setPage((current) => current + 1)}
          >
            Sau
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
              <th className="px-4 py-3">Tên file</th>
              <th className="px-4 py-3">Tên gốc</th>
              <th className="px-4 py-3">Loại</th>
              <th className="px-4 py-3">Dung lượng</th>
              <th className="px-4 py-3">Ngày tải lên</th>
              <th className="px-4 py-3">Người tải</th>
              <th className="px-4 py-3 text-right">Thao tác</th>
            </tr>
          </thead>
          <tbody className="divide-y divide-gray-100">
            {isLoading ? (
              <tr>
                <td className="px-4 py-6 text-center text-gray-600" colSpan={7}>
                  Đang tải media...
                </td>
              </tr>
            ) : null}
            {!isLoading && mediaItems.length === 0 ? (
              <tr>
                <td className="px-4 py-6 text-center text-gray-600" colSpan={7}>
                  Không có media nào.
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
                      Đã xóa
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
                      Xem
                    </Button>
                    <Button variant="ghost" size="sm" onClick={() => onCopy(media)}>
                      Sao chép URL
                    </Button>
                    {media.isDeleted ? (
                      <Button
                        variant="secondary"
                        size="sm"
                        isLoading={busyMutationId === media.id}
                        onClick={() => onRestore(media)}
                      >
                        Khôi phục
                      </Button>
                    ) : (
                      <Button
                        variant="danger"
                        size="sm"
                        isLoading={busyMutationId === media.id}
                        onClick={() => onDelete(media)}
                      >
                        Xóa
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
    <Modal open={Boolean(media)} onClose={onClose} title={media?.originalFileName ?? 'Xem trước'}>
      {media?.fileType === 'image' ? (
        <img
          src={getMediaUrl(media)}
          alt={media.originalFileName}
          className="max-h-[70vh] w-full rounded-md object-contain"
        />
      ) : null}
      {media?.fileType === 'audio' ? (
        <audio src={getMediaUrl(media)} controls className="w-full">
          Trình duyệt không hỗ trợ xem trước âm thanh.
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
