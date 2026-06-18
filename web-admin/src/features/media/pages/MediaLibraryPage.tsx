import { useMemo, useRef, useState, type ChangeEvent, type FormEvent } from 'react';
import { useMutation, useQueryClient } from '@tanstack/react-query';
import { ApiClientError } from '@/api/apiError';
import { Alert } from '@/components/ui/Alert';
import { Button } from '@/components/ui/Button';
import { Input } from '@/components/ui/Input';
import { Modal } from '@/components/ui/Modal';
import { Select } from '@/components/ui/Select';
import { useAuth } from '@/features/auth/context/AuthContext';
import { ROLE_VENDOR } from '@/features/auth/roleAccess';
import {
  createMediaApi,
  getMediaUrl,
  type ApprovalStatusFilter,
  type MediaFileDto,
} from '@/features/media/api/mediaApi';
import { useMediaQuery, mediaQueryKeys } from '@/features/media/hooks/useMediaQuery';
import { useUploadMediaMutation } from '@/features/media/hooks/useUploadMediaMutation';
import {
  createNarrationsApi,
  type NarrationDraftDto,
  type NarrationStatusFilter,
} from '@/features/narrations/api/narrationsApi';
import {
  narrationQueryKeys,
  useNarrationsQuery,
} from '@/features/narrations/hooks/useNarrationsQuery';

const PAGE_SIZE = 20;
const imageAccept = '.jpg,.jpeg,.png,.webp,image/jpeg,image/png,image/webp';

type TabKey = 'images' | 'narrations';

const approvalOptions: Array<{ value: ApprovalStatusFilter; label: string }> = [
  { value: 'all', label: 'Tất cả' },
  { value: 'Pending', label: 'Chờ duyệt' },
  { value: 'Approved', label: 'Đã duyệt' },
  { value: 'Rejected', label: 'Từ chối' },
];

const narrationStatusOptions: Array<{ value: NarrationStatusFilter; label: string }> = [
  ...approvalOptions,
  { value: 'AudioGenerated', label: 'Đã tạo âm thanh' },
];

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
  const { user, httpClient } = useAuth();
  const isVendor = user?.role === ROLE_VENDOR;
  const queryClient = useQueryClient();
  const mediaApi = useMemo(() => createMediaApi(httpClient), [httpClient]);
  const narrationsApi = useMemo(() => createNarrationsApi(httpClient), [httpClient]);

  const [activeTab, setActiveTab] = useState<TabKey>('images');
  const [imageSearch, setImageSearch] = useState('');
  const [imageStatus, setImageStatus] = useState<ApprovalStatusFilter>('all');
  const [imagePage, setImagePage] = useState(1);
  const [narrationSearch, setNarrationSearch] = useState('');
  const [narrationStatus, setNarrationStatus] = useState<NarrationStatusFilter>('all');
  const [narrationPage, setNarrationPage] = useState(1);
  const [previewMedia, setPreviewMedia] = useState<MediaFileDto | null>(null);
  const [notice, setNotice] = useState<string | null>(null);
  const [rejectImage, setRejectImage] = useState<MediaFileDto | null>(null);
  const [rejectNarration, setRejectNarration] = useState<NarrationDraftDto | null>(null);
  const [rejectReason, setRejectReason] = useState('');
  const [draftForm, setDraftForm] = useState({
    title: '',
    languageCode: 'vi',
    textContent: '',
    voice: 'female-south',
  });

  const imageInputRef = useRef<HTMLInputElement | null>(null);

  const mediaFilter = useMemo(
    () => ({
      page: imagePage,
      pageSize: PAGE_SIZE,
      search: imageSearch.trim() || undefined,
      fileType: 'image' as const,
      approvalStatus: imageStatus,
      includeDeleted: false,
    }),
    [imagePage, imageSearch, imageStatus],
  );

  const narrationFilter = useMemo(
    () => ({
      page: narrationPage,
      pageSize: PAGE_SIZE,
      search: narrationSearch.trim() || undefined,
      status: narrationStatus,
    }),
    [narrationPage, narrationSearch, narrationStatus],
  );

  const mediaQuery = useMediaQuery(mediaFilter);
  const narrationsQuery = useNarrationsQuery(narrationFilter);
  const uploadMutation = useUploadMediaMutation();

  const approveImageMutation = useMutation({
    mutationFn: (id: number) => mediaApi.approveMedia(id),
    onSuccess: async () => {
      setNotice('Đã duyệt ảnh.');
      await queryClient.invalidateQueries({ queryKey: mediaQueryKeys.all });
    },
  });

  const rejectImageMutation = useMutation({
    mutationFn: ({ id, reason }: { id: number; reason: string }) => mediaApi.rejectMedia(id, reason),
    onSuccess: async () => {
      setNotice('Đã từ chối ảnh.');
      setRejectImage(null);
      setRejectReason('');
      await queryClient.invalidateQueries({ queryKey: mediaQueryKeys.all });
    },
  });

  const createNarrationMutation = useMutation({
    mutationFn: () => narrationsApi.createNarration(draftForm),
    onSuccess: async () => {
      setNotice(isVendor ? 'Đã gửi bản thuyết minh chờ duyệt.' : 'Đã tạo bản thuyết minh.');
      setDraftForm({ title: '', languageCode: 'vi', textContent: '', voice: 'female-south' });
      await queryClient.invalidateQueries({ queryKey: narrationQueryKeys.all });
    },
  });

  const approveNarrationMutation = useMutation({
    mutationFn: (id: number) => narrationsApi.approveNarration(id),
    onSuccess: async () => {
      setNotice('Đã duyệt bản thuyết minh.');
      await queryClient.invalidateQueries({ queryKey: narrationQueryKeys.all });
    },
  });

  const rejectNarrationMutation = useMutation({
    mutationFn: ({ id, reason }: { id: number; reason: string }) =>
      narrationsApi.rejectNarration(id, reason),
    onSuccess: async () => {
      setNotice('Đã từ chối bản thuyết minh.');
      setRejectNarration(null);
      setRejectReason('');
      await queryClient.invalidateQueries({ queryKey: narrationQueryKeys.all });
    },
  });

  const generateAudioMutation = useMutation({
    mutationFn: (id: number) => narrationsApi.generateAudio(id),
    onSuccess: async () => {
      setNotice('Đã tạo âm thanh mô phỏng. TTS mô phỏng / chưa kết nối dịch vụ thật.');
      await queryClient.invalidateQueries({ queryKey: narrationQueryKeys.all });
    },
  });

  const handleUploadImages = async (event: ChangeEvent<HTMLInputElement>) => {
    const files = Array.from(event.target.files ?? []);
    event.target.value = '';
    if (files.length === 0) return;

    setNotice(null);
    for (const file of files) {
      await uploadMutation.mutateAsync(file);
    }

    setImagePage(1);
    setNotice(isVendor ? `Đã gửi ${files.length} ảnh chờ duyệt.` : `Đã tải lên ${files.length} ảnh.`);
  };

  const handleSubmitNarration = (event: FormEvent<HTMLFormElement>) => {
    event.preventDefault();
    setNotice(null);
    createNarrationMutation.mutate();
  };

  const handleSubmitReject = () => {
    const reason = rejectReason.trim();
    if (!reason) {
      setNotice('Vui lòng nhập lý do từ chối.');
      return;
    }

    if (rejectImage) {
      rejectImageMutation.mutate({ id: rejectImage.id, reason });
    }

    if (rejectNarration) {
      rejectNarrationMutation.mutate({ id: rejectNarration.id, reason });
    }
  };

  const queryError = getErrorMessage(mediaQuery.error, 'Không thể tải thư viện ảnh.');
  const narrationError = getErrorMessage(narrationsQuery.error, 'Không thể tải bản thuyết minh.');
  const mutationError = getErrorMessage(
    uploadMutation.error ||
      approveImageMutation.error ||
      rejectImageMutation.error ||
      createNarrationMutation.error ||
      approveNarrationMutation.error ||
      rejectNarrationMutation.error ||
      generateAudioMutation.error,
    'Thao tác thất bại. Vui lòng thử lại.',
  );

  return (
    <section className="app-page">
      <div className="app-page-header">
        <div>
          <h1 className="app-title">Thư viện</h1>
          <p className="app-subtitle">
            {isVendor
              ? 'Quản lý ảnh và bản thuyết minh gửi duyệt.'
              : 'Duyệt ảnh, quản lý bản thuyết minh và tạo âm thanh mô phỏng.'}
          </p>
        </div>
      </div>

      <div className="flex flex-wrap gap-2 border-b border-gray-200">
        <TabButton active={activeTab === 'images'} onClick={() => setActiveTab('images')}>
          Ảnh
        </TabButton>
        <TabButton active={activeTab === 'narrations'} onClick={() => setActiveTab('narrations')}>
          Bản thuyết minh
        </TabButton>
      </div>

      {notice ? <Alert message={notice} /> : null}
      {queryError && activeTab === 'images' ? <Alert variant="error" message={queryError} /> : null}
      {narrationError && activeTab === 'narrations' ? (
        <Alert variant="error" message={narrationError} />
      ) : null}
      {mutationError ? <Alert variant="error" message={mutationError} /> : null}

      {activeTab === 'images' ? (
        <>
          <div className="app-page-header">
            <div className="grid flex-1 gap-3 md:grid-cols-[1fr_220px]">
              <Input
                id="image-search"
                label="Tìm kiếm"
                placeholder="Tên file hoặc tên gốc"
                value={imageSearch}
                onChange={(event) => {
                  setImageSearch(event.target.value);
                  setImagePage(1);
                }}
              />
              <Select
                id="image-status-filter"
                label="Trạng thái"
                value={imageStatus}
                options={approvalOptions}
                onChange={(event) => {
                  setImageStatus(event.target.value as ApprovalStatusFilter);
                  setImagePage(1);
                }}
              />
            </div>
            <div>
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

          <ImageTable
            mediaItems={mediaQuery.data?.items ?? []}
            isLoading={mediaQuery.isLoading}
            isVendor={isVendor}
            busyId={getBusyMutationId(
              approveImageMutation.variables,
              rejectImageMutation.variables,
            )}
            onPreview={setPreviewMedia}
            onCopy={async (media) => {
              await navigator.clipboard.writeText(getMediaUrl(media));
              setNotice('Đã sao chép URL ảnh.');
            }}
            onApprove={(media) => approveImageMutation.mutate(media.id)}
            onReject={(media) => {
              setRejectImage(media);
              setRejectReason('');
            }}
          />

          <Pagination
            page={imagePage}
            totalPages={mediaQuery.data?.totalPages ?? 0}
            totalCount={mediaQuery.data?.totalCount}
            itemLabel="ảnh"
            onPageChange={setImagePage}
          />
        </>
      ) : (
        <>
          <NarrationForm
            form={draftForm}
            isLoading={createNarrationMutation.isPending}
            onChange={setDraftForm}
            onSubmit={handleSubmitNarration}
          />

          <div className="grid gap-3 rounded-xl border border-gray-100 bg-white p-4 shadow-sm md:grid-cols-[1fr_220px]">
            <Input
              id="narration-search"
              label="Tìm kiếm"
              placeholder="Tiêu đề hoặc nội dung"
              value={narrationSearch}
              onChange={(event) => {
                setNarrationSearch(event.target.value);
                setNarrationPage(1);
              }}
            />
            <Select
              id="narration-status-filter"
              label="Trạng thái"
              value={narrationStatus}
              options={narrationStatusOptions}
              onChange={(event) => {
                setNarrationStatus(event.target.value as NarrationStatusFilter);
                setNarrationPage(1);
              }}
            />
          </div>

          <NarrationTable
            drafts={narrationsQuery.data?.items ?? []}
            isLoading={narrationsQuery.isLoading}
            isVendor={isVendor}
            busyId={getBusyMutationId(
              approveNarrationMutation.variables,
              rejectNarrationMutation.variables,
              generateAudioMutation.variables,
            )}
            onApprove={(draft) => approveNarrationMutation.mutate(draft.id)}
            onReject={(draft) => {
              setRejectNarration(draft);
              setRejectReason('');
            }}
            onGenerateAudio={(draft) => generateAudioMutation.mutate(draft.id)}
          />

          <Pagination
            page={narrationPage}
            totalPages={narrationsQuery.data?.totalPages ?? 0}
            totalCount={narrationsQuery.data?.totalCount}
            itemLabel="bản thuyết minh"
            onPageChange={setNarrationPage}
          />
        </>
      )}

      <MediaPreviewModal media={previewMedia} onClose={() => setPreviewMedia(null)} />
      <RejectModal
        open={Boolean(rejectImage || rejectNarration)}
        reason={rejectReason}
        isLoading={rejectImageMutation.isPending || rejectNarrationMutation.isPending}
        onReasonChange={setRejectReason}
        onClose={() => {
          setRejectImage(null);
          setRejectNarration(null);
          setRejectReason('');
        }}
        onSubmit={handleSubmitReject}
      />
    </section>
  );
}

function TabButton({
  active,
  onClick,
  children,
}: {
  active: boolean;
  onClick: () => void;
  children: React.ReactNode;
}) {
  return (
    <button
      type="button"
      onClick={onClick}
      className={`border-b-2 px-4 py-2 text-sm font-medium ${
        active
          ? 'border-blue-600 text-blue-700'
          : 'border-transparent text-gray-500 hover:text-gray-800'
      }`}
    >
      {children}
    </button>
  );
}

function ImageTable({
  mediaItems,
  isLoading,
  isVendor,
  busyId,
  onPreview,
  onCopy,
  onApprove,
  onReject,
}: {
  mediaItems: MediaFileDto[];
  isLoading: boolean;
  isVendor: boolean;
  busyId: number | null;
  onPreview: (media: MediaFileDto) => void;
  onCopy: (media: MediaFileDto) => void;
  onApprove: (media: MediaFileDto) => void;
  onReject: (media: MediaFileDto) => void;
}) {
  return (
    <div className="overflow-hidden rounded-xl border border-gray-100 bg-white shadow-sm">
      <div className="overflow-x-auto">
        <table className="min-w-full divide-y divide-gray-100 text-sm">
          <thead className="bg-gray-50 text-left text-xs font-semibold uppercase text-gray-500">
            <tr>
              <th className="px-4 py-3">Tên gốc</th>
              <th className="px-4 py-3">Trạng thái</th>
              <th className="px-4 py-3">Ngày tải lên</th>
              <th className="px-4 py-3">Người tải</th>
              <th className="px-4 py-3">Lý do từ chối</th>
              <th className="px-4 py-3 text-right">Thao tác</th>
            </tr>
          </thead>
          <tbody className="divide-y divide-gray-100">
            {isLoading ? (
              <tr>
                <td className="px-4 py-6 text-center text-gray-600" colSpan={6}>
                  Đang tải ảnh...
                </td>
              </tr>
            ) : null}
            {!isLoading && mediaItems.length === 0 ? (
              <tr>
                <td className="px-4 py-6 text-center text-gray-600" colSpan={6}>
                  Không có ảnh nào.
                </td>
              </tr>
            ) : null}
            {mediaItems.map((media) => (
              <tr key={media.id}>
                <td className="max-w-[260px] truncate px-4 py-3 font-medium text-gray-900">
                  {media.originalFileName}
                </td>
                <td className="px-4 py-3">
                  <StatusBadge status={media.approvalStatus} />
                </td>
                <td className="px-4 py-3 text-gray-600">{formatDate(media.uploadedAt)}</td>
                <td className="px-4 py-3 text-gray-600">
                  {media.uploadedByUsername ?? media.uploadedByUserId ?? '-'}
                </td>
                <td className="max-w-[280px] px-4 py-3 text-gray-600">
                  {media.rejectionReason ?? '-'}
                </td>
                <td className="px-4 py-3">
                  <div className="flex flex-wrap justify-end gap-2">
                    <Button variant="ghost" size="sm" onClick={() => onPreview(media)}>
                      Xem
                    </Button>
                    <Button variant="ghost" size="sm" onClick={() => onCopy(media)}>
                      Sao chép URL
                    </Button>
                    {!isVendor && media.approvalStatus !== 'Approved' ? (
                      <Button
                        variant="secondary"
                        size="sm"
                        isLoading={busyId === media.id}
                        onClick={() => onApprove(media)}
                      >
                        Duyệt
                      </Button>
                    ) : null}
                    {!isVendor && media.approvalStatus !== 'Rejected' ? (
                      <Button
                        variant="danger"
                        size="sm"
                        isLoading={busyId === media.id}
                        onClick={() => onReject(media)}
                      >
                        Từ chối
                      </Button>
                    ) : null}
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

function NarrationForm({
  form,
  isLoading,
  onChange,
  onSubmit,
}: {
  form: { title: string; languageCode: string; textContent: string; voice: string };
  isLoading: boolean;
  onChange: (form: { title: string; languageCode: string; textContent: string; voice: string }) => void;
  onSubmit: (event: FormEvent<HTMLFormElement>) => void;
}) {
  return (
    <form className="rounded-xl border border-gray-100 bg-white p-4 shadow-sm" onSubmit={onSubmit}>
      <div className="grid gap-4 lg:grid-cols-2">
        <Input
          id="narration-title"
          label="Tiêu đề"
          value={form.title}
          onChange={(event) => onChange({ ...form, title: event.target.value })}
          required
        />
        <Select
          id="narration-language"
          label="Ngôn ngữ"
          value={form.languageCode}
          options={languageOptions}
          onChange={(event) => onChange({ ...form, languageCode: event.target.value })}
        />
        <div className="lg:col-span-2">
          <label htmlFor="narration-text" className="mb-1 block text-sm font-medium text-gray-700">
            Nội dung thuyết minh
          </label>
          <textarea
            id="narration-text"
            rows={5}
            value={form.textContent}
            onChange={(event) => onChange({ ...form, textContent: event.target.value })}
            required
            className="w-full rounded-md border border-gray-300 px-3 py-2 text-sm shadow-sm transition-colors focus:border-blue-500 focus:outline-none focus:ring-2 focus:ring-blue-500"
          />
        </div>
        <Select
          id="narration-voice"
          label="Giọng đọc"
          value={form.voice}
          options={voiceOptions}
          onChange={(event) => onChange({ ...form, voice: event.target.value })}
        />
        <div className="flex items-end">
          <Button type="submit" isLoading={isLoading}>
            Tạo bản thuyết minh mới
          </Button>
        </div>
      </div>
    </form>
  );
}

function NarrationTable({
  drafts,
  isLoading,
  isVendor,
  busyId,
  onApprove,
  onReject,
  onGenerateAudio,
}: {
  drafts: NarrationDraftDto[];
  isLoading: boolean;
  isVendor: boolean;
  busyId: number | null;
  onApprove: (draft: NarrationDraftDto) => void;
  onReject: (draft: NarrationDraftDto) => void;
  onGenerateAudio: (draft: NarrationDraftDto) => void;
}) {
  return (
    <div className="overflow-hidden rounded-xl border border-gray-100 bg-white shadow-sm">
      <div className="overflow-x-auto">
        <table className="min-w-full divide-y divide-gray-100 text-sm">
          <thead className="bg-gray-50 text-left text-xs font-semibold uppercase text-gray-500">
            <tr>
              <th className="px-4 py-3">Tiêu đề</th>
              <th className="px-4 py-3">Ngôn ngữ</th>
              <th className="px-4 py-3">Giọng đọc</th>
              <th className="px-4 py-3">Trạng thái</th>
              <th className="px-4 py-3">Người gửi</th>
              <th className="px-4 py-3">Lý do từ chối</th>
              {!isVendor ? <th className="px-4 py-3 text-right">Thao tác</th> : null}
            </tr>
          </thead>
          <tbody className="divide-y divide-gray-100">
            {isLoading ? (
              <tr>
                <td className="px-4 py-6 text-center text-gray-600" colSpan={isVendor ? 6 : 7}>
                  Đang tải bản thuyết minh...
                </td>
              </tr>
            ) : null}
            {!isLoading && drafts.length === 0 ? (
              <tr>
                <td className="px-4 py-6 text-center text-gray-600" colSpan={isVendor ? 6 : 7}>
                  Không có bản thuyết minh nào.
                </td>
              </tr>
            ) : null}
            {drafts.map((draft) => (
              <tr key={draft.id}>
                <td className="max-w-[260px] px-4 py-3">
                  <p className="font-medium text-gray-900">{draft.title}</p>
                  <p className="line-clamp-2 text-xs text-gray-500">{draft.textContent}</p>
                  {draft.simulatedAudioUrl ? (
                    <p className="mt-1 text-xs text-blue-600">
                      TTS mô phỏng / chưa kết nối dịch vụ thật
                    </p>
                  ) : null}
                </td>
                <td className="px-4 py-3 text-gray-600">{draft.languageCode}</td>
                <td className="px-4 py-3 text-gray-600">{draft.voice}</td>
                <td className="px-4 py-3">
                  <StatusBadge status={draft.status} />
                </td>
                <td className="px-4 py-3 text-gray-600">
                  {draft.submittedByUsername ?? draft.submittedByUserId}
                </td>
                <td className="max-w-[240px] px-4 py-3 text-gray-600">
                  {draft.rejectionReason ?? '-'}
                </td>
                {!isVendor ? (
                  <td className="px-4 py-3">
                    <div className="flex flex-wrap justify-end gap-2">
                      {draft.status !== 'Approved' && draft.status !== 'AudioGenerated' ? (
                        <Button
                          variant="secondary"
                          size="sm"
                          isLoading={busyId === draft.id}
                          onClick={() => onApprove(draft)}
                        >
                          Duyệt
                        </Button>
                      ) : null}
                      {draft.status !== 'Rejected' && draft.status !== 'AudioGenerated' ? (
                        <Button
                          variant="danger"
                          size="sm"
                          isLoading={busyId === draft.id}
                          onClick={() => onReject(draft)}
                        >
                          Từ chối
                        </Button>
                      ) : null}
                      {draft.status === 'Approved' ? (
                        <Button
                          size="sm"
                          isLoading={busyId === draft.id}
                          onClick={() => onGenerateAudio(draft)}
                        >
                          Tạo âm thanh
                        </Button>
                      ) : null}
                    </div>
                  </td>
                ) : null}
              </tr>
            ))}
          </tbody>
        </table>
      </div>
    </div>
  );
}

function Pagination({
  page,
  totalPages,
  totalCount,
  itemLabel,
  onPageChange,
}: {
  page: number;
  totalPages: number;
  totalCount?: number;
  itemLabel: string;
  onPageChange: (page: number) => void;
}) {
  return (
    <div className="flex items-center justify-between text-sm text-gray-600">
      <span>{typeof totalCount === 'number' ? `${totalCount} ${itemLabel}` : `Đang tải ${itemLabel}`}</span>
      <div className="flex items-center gap-2">
        <Button
          variant="secondary"
          size="sm"
          disabled={page <= 1}
          onClick={() => onPageChange(Math.max(1, page - 1))}
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
          onClick={() => onPageChange(page + 1)}
        >
          Sau
        </Button>
      </div>
    </div>
  );
}

function StatusBadge({ status }: { status: string }) {
  const tone =
    status === 'Approved' || status === 'AudioGenerated'
      ? 'bg-emerald-50 text-emerald-700'
      : status === 'Rejected'
        ? 'bg-red-50 text-red-700'
        : 'bg-amber-50 text-amber-700';

  return (
    <span className={`rounded-full px-2 py-1 text-xs font-medium ${tone}`}>
      {statusLabel(status)}
    </span>
  );
}

function RejectModal({
  open,
  reason,
  isLoading,
  onReasonChange,
  onClose,
  onSubmit,
}: {
  open: boolean;
  reason: string;
  isLoading: boolean;
  onReasonChange: (reason: string) => void;
  onClose: () => void;
  onSubmit: () => void;
}) {
  return (
    <Modal open={open} onClose={onClose} title="Lý do từ chối">
      <div className="space-y-4">
        <textarea
          rows={4}
          value={reason}
          onChange={(event) => onReasonChange(event.target.value)}
          className="w-full rounded-md border border-gray-300 px-3 py-2 text-sm shadow-sm transition-colors focus:border-blue-500 focus:outline-none focus:ring-2 focus:ring-blue-500"
        />
        <div className="flex justify-end gap-2">
          <Button variant="secondary" onClick={onClose}>
            Hủy
          </Button>
          <Button variant="danger" isLoading={isLoading} onClick={onSubmit}>
            Từ chối
          </Button>
        </div>
      </div>
    </Modal>
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
      {media ? (
        <img
          src={getMediaUrl(media)}
          alt={media.originalFileName}
          className="max-h-[70vh] w-full rounded-md object-contain"
        />
      ) : null}
    </Modal>
  );
}

function getBusyMutationId(...values: unknown[]): number | null {
  for (const value of values) {
    if (typeof value === 'number') return value;
    if (typeof value === 'object' && value !== null && 'id' in value) {
      const id = (value as { id?: unknown }).id;
      if (typeof id === 'number') return id;
    }
  }

  return null;
}

function statusLabel(status: string): string {
  switch (status) {
    case 'Pending':
      return 'Chờ duyệt';
    case 'Approved':
      return 'Đã duyệt';
    case 'Rejected':
      return 'Từ chối';
    case 'AudioGenerated':
      return 'Đã tạo âm thanh';
    default:
      return status;
  }
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
  if (!error) return null;
  if (error instanceof ApiClientError) return error.message;
  return fallback;
}
