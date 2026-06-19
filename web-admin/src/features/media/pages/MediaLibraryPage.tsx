import { useEffect, useMemo, useRef, useState, type ChangeEvent, type FormEvent } from 'react';
import { useMutation, useQuery, useQueryClient } from '@tanstack/react-query';
import { ApiClientError } from '@/api/apiError';
import { Alert } from '@/components/ui/Alert';
import { Button } from '@/components/ui/Button';
import { Input } from '@/components/ui/Input';
import { Modal } from '@/components/ui/Modal';
import { SecureImage } from '@/components/ui/SecureImage';
import { Select } from '@/components/ui/Select';
import { useAuth } from '@/features/auth/context/AuthContext';
import { ROLE_VENDOR, isAdminRole } from '@/features/auth/roleAccess';
import {
  createMediaApi,
  getMediaUrl,
  type ApprovalStatusFilter,
  type MediaFileDto,
} from '@/features/media/api/mediaApi';
import { useMediaQuery, mediaQueryKeys } from '@/features/media/hooks/useMediaQuery';
import { useUploadMediaMutation } from '@/features/media/hooks/useUploadMediaMutation';
import { createPoisApi, type PoiDto } from '@/features/pois/api/poisApi';
import {
  createNarrationsApi,
  type NarrationDraftDto,
  type NarrationStatusFilter,
} from '@/features/narrations/api/narrationsApi';
import {
  narrationQueryKeys,
  useNarrationsQuery,
} from '@/features/narrations/hooks/useNarrationsQuery';
import { formatLanguageLabel, languageOptions } from '@/features/languages/utils/languageLabels';

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

const voiceOptions = [
  { value: 'female-north', label: 'Nữ miền Bắc' },
  { value: 'female-south', label: 'Nữ miền Nam' },
  { value: 'male-north', label: 'Nam miền Bắc' },
  { value: 'male-south', label: 'Nam miền Nam' },
];

export function MediaLibraryPage() {
  const { user, httpClient } = useAuth();
  const isVendor = user?.role === ROLE_VENDOR;
  const canUploadNarrationAudio = isAdminRole(user?.role);
  const queryClient = useQueryClient();
  const mediaApi = useMemo(() => createMediaApi(httpClient), [httpClient]);
  const narrationsApi = useMemo(() => createNarrationsApi(httpClient), [httpClient]);
  const poisApi = useMemo(() => createPoisApi(httpClient), [httpClient]);

  const [activeTab, setActiveTab] = useState<TabKey>(
    new URLSearchParams(window.location.search).get('tab') === 'narrations' ? 'narrations' : 'images',
  );
  const [imageSearch, setImageSearch] = useState('');
  const [imageStatus, setImageStatus] = useState<ApprovalStatusFilter>('all');
  const [imagePage, setImagePage] = useState(1);
  const [selectedPoi, setSelectedPoi] = useState<PoiDto | null>(null);
  const [imageModalOpen, setImageModalOpen] = useState(false);
  const [narrationSearch, setNarrationSearch] = useState('');
  const [narrationStatus, setNarrationStatus] = useState<NarrationStatusFilter>('all');
  const [narrationPage, setNarrationPage] = useState(1);
  const [previewMedia, setPreviewMedia] = useState<MediaFileDto | null>(null);
  const [notice, setNotice] = useState<string | null>(null);
  const [rejectImage, setRejectImage] = useState<MediaFileDto | null>(null);
  const [rejectNarration, setRejectNarration] = useState<NarrationDraftDto | null>(null);
  const [viewNarration, setViewNarration] = useState<NarrationDraftDto | null>(null);
  const [uploadAudioDraft, setUploadAudioDraft] = useState<NarrationDraftDto | null>(null);
  const [rejectReason, setRejectReason] = useState('');
  const [draftForm, setDraftForm] = useState({
    title: '',
    languageCode: 'vi',
    textContent: '',
    voice: 'female-south',
  });

  const imageInputRef = useRef<HTMLInputElement | null>(null);
  const requestedPoiId = Number(new URLSearchParams(window.location.search).get('poiId'));
  const poiIdForFilter = selectedPoi?.id
    ?? (Number.isInteger(requestedPoiId) && requestedPoiId > 0 ? requestedPoiId : undefined);

  const mediaFilter = useMemo(
    () => ({
      page: 1,
      pageSize: 2000,
      fileType: 'image' as const,
      includeDeleted: false,
    }),
    [],
  );

  const poiFilter = useMemo(
    () => ({
      page: 1,
      pageSize: 500,
      search: imageSearch.trim() || undefined,
      includeDeleted: false,
    }),
    [imageSearch],
  );

  const narrationFilter = useMemo(
    () => ({
      page: narrationPage,
      pageSize: PAGE_SIZE,
      search: narrationSearch.trim() || undefined,
      status: narrationStatus,
      poiId: poiIdForFilter,
    }),
    [narrationPage, narrationSearch, narrationStatus, poiIdForFilter],
  );

  const mediaQuery = useMediaQuery(mediaFilter);
  const poisQuery = useQuery({
    queryKey: ['library-pois', poiFilter],
    queryFn: () => poisApi.getPois(poiFilter),
  });

  const poiSelectOptions = useMemo(
    () => [
      { value: '', label: 'Chọn POI/sạp...' },
      ...(poisQuery.data?.items.map((poi) => ({
        value: String(poi.id),
        label: `${poi.name || poi.displayName || poi.code} (${poi.code})`,
      })) ?? []),
    ],
    [poisQuery.data?.items],
  );

  useEffect(() => {
    if (selectedPoi || !poisQuery.data?.items.length) {
      return;
    }

    if (Number.isInteger(requestedPoiId) && requestedPoiId > 0) {
      const poiFromUrl = poisQuery.data.items.find((poi) => poi.id === requestedPoiId);
      if (poiFromUrl) {
        setSelectedPoi(poiFromUrl);
      }
    }
  }, [poisQuery.data?.items, requestedPoiId, selectedPoi]);
  const currentPoi = selectedPoi
    ?? poisQuery.data?.items.find((poi) => Number.isInteger(requestedPoiId) && poi.id === requestedPoiId)
    ?? null;
  const selectedPoiMediaQuery = useQuery({
    queryKey: ['media', 'by-poi', poiIdForFilter, imageStatus, imagePage],
    queryFn: () =>
      poiIdForFilter
        ? mediaApi.getMediaByPoi(poiIdForFilter, {
            page: imagePage,
            pageSize: PAGE_SIZE,
            approvalStatus: imageStatus,
          })
        : Promise.resolve({ items: [], page: 1, pageSize: PAGE_SIZE, totalCount: 0, totalPages: 0 }),
    enabled: activeTab === 'images' && Boolean(poiIdForFilter),
  });
  const narrationsQuery = useNarrationsQuery(narrationFilter, { enabled: activeTab === 'narrations' });
  const uploadMutation = useUploadMediaMutation();

  const approveImageMutation = useMutation({
    mutationFn: (id: number) => mediaApi.approveMedia(id),
    onSuccess: async () => {
      setNotice('Đã duyệt ảnh.');
      await queryClient.invalidateQueries({ queryKey: mediaQueryKeys.all });
      await queryClient.invalidateQueries({ queryKey: ['media', 'by-poi'] });
    },
  });

  const rejectImageMutation = useMutation({
    mutationFn: ({ id, reason }: { id: number; reason: string }) => mediaApi.rejectMedia(id, reason),
    onSuccess: async () => {
      setNotice('Đã từ chối ảnh.');
      setRejectImage(null);
      setRejectReason('');
      await queryClient.invalidateQueries({ queryKey: mediaQueryKeys.all });
      await queryClient.invalidateQueries({ queryKey: ['media', 'by-poi'] });
    },
  });

  const createNarrationMutation = useMutation({
    mutationFn: () => {
      if (!currentPoi) {
        throw new Error('POI is required.');
      }

      return narrationsApi.createNarration({ ...draftForm, poiId: currentPoi.id });
    },
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

  const uploadNarrationAudioMutation = useMutation({
    mutationFn: ({ draft, file, title }: { draft: NarrationDraftDto; file: File; title?: string }) =>
      narrationsApi.uploadAudio(draft.id, { file, title }),
    onSuccess: async () => {
      setNotice('Đã tải MP3 và gắn audio cho bản thuyết minh.');
      setUploadAudioDraft(null);
      await queryClient.invalidateQueries({ queryKey: narrationQueryKeys.all });
    },
  });

  const handleUploadImages = async (event: ChangeEvent<HTMLInputElement>) => {
    const files = Array.from(event.target.files ?? []);
    event.target.value = '';
    if (files.length === 0) return;

    setNotice(null);
    if (!currentPoi) {
      setNotice('Vui lòng chọn POI/sạp trước khi tải ảnh.');
      return;
    }

    for (const file of files) {
      await uploadMutation.mutateAsync({ file, poiId: currentPoi.id });
    }

    setImagePage(1);
    await queryClient.invalidateQueries({ queryKey: ['media', 'by-poi'] });
    setNotice(isVendor ? `Đã gửi ${files.length} ảnh chờ duyệt.` : `Đã tải lên ${files.length} ảnh.`);
  };

  const handleSubmitNarration = (event: FormEvent<HTMLFormElement>) => {
    event.preventDefault();
    setNotice(null);
    if (!currentPoi) {
      setNotice('Vui lòng chọn POI/sạp trước khi tạo bản thuyết minh.');
      return;
    }

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
  const queryError = getErrorMessage(
    mediaQuery.error || poisQuery.error || selectedPoiMediaQuery.error,
    'Không thể tải thư viện ảnh.',
  );
  const narrationError = getErrorMessage(narrationsQuery.error, 'Không thể tải bản thuyết minh.');
  const mutationError = getErrorMessage(
    uploadMutation.error ||
      approveImageMutation.error ||
      rejectImageMutation.error ||
      createNarrationMutation.error ||
      approveNarrationMutation.error ||
      rejectNarrationMutation.error ||
      uploadNarrationAudioMutation.error,
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

      <div className="grid gap-3 rounded-xl border border-gray-100 bg-white p-4 shadow-sm md:grid-cols-[1fr_280px]">
        <Input
          id="poi-search"
          label="Tìm kiếm POI/sạp"
          placeholder="Tên hoặc mã POI/sạp"
          value={imageSearch}
          onChange={(event) => {
            setImageSearch(event.target.value);
            setImagePage(1);
          }}
        />
        <Select
          id="library-poi-select"
          label="POI/sạp đang chọn"
          value={currentPoi ? String(currentPoi.id) : ''}
          options={poiSelectOptions}
          onChange={(event) => {
            const poiId = Number(event.target.value);
            if (!poiId) {
              setSelectedPoi(null);
              return;
            }

            const poi =
              poisQuery.data?.items.find((item) => item.id === poiId)
              ?? (currentPoi?.id === poiId ? currentPoi : null);
            setSelectedPoi(poi ?? null);
            setImagePage(1);
            setNarrationPage(1);
          }}
        />
      </div>

      {activeTab === 'images' ? (
        <>
          <div className="app-page-header">
            <div className="grid flex-1 gap-3 md:grid-cols-[1fr_220px]">
              <Select
                id="image-status-filter"
                label="Trạng thái ảnh"
                value={imageStatus}
                options={approvalOptions}
                onChange={(event) => {
                  setImageStatus(event.target.value as ApprovalStatusFilter);
                  setImagePage(1);
                }}
              />
            </div>
            {isVendor ? (
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
                {currentPoi ? `Tải ảnh cho ${currentPoi.name || currentPoi.code}` : 'Chọn POI để tải ảnh'}
              </Button>
            </div>
            ) : null}
          </div>

          <PoiImageList
            pois={poisQuery.data?.items ?? []}
            mediaItems={mediaQuery.data?.items ?? []}
            isLoading={poisQuery.isLoading || mediaQuery.isLoading}
            onSelect={(poi) => {
              setSelectedPoi(poi);
              setImageModalOpen(true);
              setImagePage(1);
            }}
          />
        </>
      ) : (
        <>
          {isVendor ? (
            <NarrationForm
              form={draftForm}
              poi={currentPoi}
              isLoading={createNarrationMutation.isPending}
              onChange={setDraftForm}
              onSubmit={handleSubmitNarration}
            />
          ) : null}

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
              uploadNarrationAudioMutation.variables,
            )}
            canUploadAudio={canUploadNarrationAudio}
            onApprove={(draft) => approveNarrationMutation.mutate(draft.id)}
            onReject={(draft) => {
              setRejectNarration(draft);
              setRejectReason('');
            }}
            onView={setViewNarration}
            onUploadAudio={setUploadAudioDraft}
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

      <PoiImagesModal
        poi={imageModalOpen ? currentPoi : null}
        mediaItems={selectedPoiMediaQuery.data?.items ?? []}
        isLoading={selectedPoiMediaQuery.isLoading}
        isVendor={isVendor}
        busyId={getBusyMutationId(
          approveImageMutation.variables,
          rejectImageMutation.variables,
        )}
        page={imagePage}
        totalPages={selectedPoiMediaQuery.data?.totalPages ?? 0}
        totalCount={selectedPoiMediaQuery.data?.totalCount}
        onClose={() => setImageModalOpen(false)}
        onPageChange={setImagePage}
        onUpload={() => imageInputRef.current?.click()}
        uploadLoading={uploadMutation.isPending}
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
      <NarrationTextModal draft={viewNarration} onClose={() => setViewNarration(null)} />
      <UploadNarrationAudioModal
        draft={uploadAudioDraft}
        isLoading={uploadNarrationAudioMutation.isPending}
        onClose={() => setUploadAudioDraft(null)}
        onSubmit={(file, title) => {
          if (uploadAudioDraft) {
            uploadNarrationAudioMutation.mutate({ draft: uploadAudioDraft, file, title });
          }
        }}
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

function PoiImageList({
  pois,
  mediaItems,
  isLoading,
  onSelect,
}: {
  pois: PoiDto[];
  mediaItems: MediaFileDto[];
  isLoading: boolean;
  onSelect: (poi: PoiDto) => void;
}) {
  if (isLoading) {
    return (
      <div className="rounded-xl border border-gray-100 bg-white p-6 text-center text-sm text-gray-600 shadow-sm">
        Đang tải danh sách POI/sạp...
      </div>
    );
  }

  if (pois.length === 0) {
    return (
      <div className="rounded-xl border border-gray-100 bg-white p-6 text-center text-sm text-gray-600 shadow-sm">
        Không có POI/sạp phù hợp.
      </div>
    );
  }

  return (
    <div className="grid gap-3 md:grid-cols-2 xl:grid-cols-3">
      {pois.map((poi) => {
        const counts = getPoiImageCounts(mediaItems, poi.id);
        return (
          <button
            key={poi.id}
            type="button"
            onClick={() => onSelect(poi)}
            className="rounded-lg border border-gray-100 bg-white p-4 text-left shadow-sm transition hover:border-blue-200 hover:shadow-md"
          >
            <div className="flex items-start justify-between gap-3">
              <div>
                <p className="font-semibold text-gray-900">{poi.name || poi.displayName || poi.code}</p>
                <p className="mt-0.5 text-xs text-gray-500">{poi.code}</p>
              </div>
              <span className="rounded-full bg-gray-100 px-2 py-1 text-xs text-gray-600">
                {counts.total} ảnh
              </span>
            </div>
            <div className="mt-4 grid grid-cols-3 gap-2 text-xs">
              <CountPill label="Chờ duyệt" value={counts.pending} className="bg-amber-50 text-amber-700" />
              <CountPill label="Đã duyệt" value={counts.approved} className="bg-emerald-50 text-emerald-700" />
              <CountPill label="Từ chối" value={counts.rejected} className="bg-red-50 text-red-700" />
            </div>
            <p className="mt-3 text-xs text-gray-500">
              Vendor: {poi.displayName || poi.userId || '-'}
            </p>
          </button>
        );
      })}
    </div>
  );
}

function CountPill({
  label,
  value,
  className,
}: {
  label: string;
  value: number;
  className: string;
}) {
  return (
    <span className={`rounded-md px-2 py-1 font-medium ${className}`}>
      {label}: {value}
    </span>
  );
}

function PoiImagesModal({
  poi,
  mediaItems,
  isLoading,
  isVendor,
  busyId,
  page,
  totalPages,
  totalCount,
  uploadLoading,
  onClose,
  onPageChange,
  onUpload,
  onPreview,
  onCopy,
  onApprove,
  onReject,
}: {
  poi: PoiDto | null;
  mediaItems: MediaFileDto[];
  isLoading: boolean;
  isVendor: boolean;
  busyId: number | null;
  page: number;
  totalPages: number;
  totalCount?: number;
  uploadLoading: boolean;
  onClose: () => void;
  onPageChange: (page: number) => void;
  onUpload: () => void;
  onPreview: (media: MediaFileDto) => void;
  onCopy: (media: MediaFileDto) => void;
  onApprove: (media: MediaFileDto) => void;
  onReject: (media: MediaFileDto) => void;
}) {
  return (
    <Modal open={Boolean(poi)} onClose={onClose} title={poi ? `Ảnh của ${poi.name || poi.code}` : 'Ảnh POI'} scrollable>
      {poi ? (
        <div className="space-y-4">
          <div className="flex flex-wrap items-center justify-between gap-3 rounded-lg bg-gray-50 px-4 py-3 text-sm">
            <div>
              <p className="font-semibold text-gray-900">{poi.name || poi.displayName || poi.code}</p>
              <p className="text-xs text-gray-500">{poi.code}</p>
            </div>
            {isVendor ? (
              <Button variant="secondary" onClick={onUpload} isLoading={uploadLoading}>
                Tải ảnh cho POI này
              </Button>
            ) : null}
          </div>

          <ImageTable
            mediaItems={mediaItems}
            isLoading={isLoading}
            isVendor={isVendor}
            busyId={busyId}
            onPreview={onPreview}
            onCopy={onCopy}
            onApprove={onApprove}
            onReject={onReject}
          />

          <Pagination
            page={page}
            totalPages={totalPages}
            totalCount={totalCount}
            itemLabel="ảnh"
            onPageChange={onPageChange}
          />
        </div>
      ) : null}
    </Modal>
  );
}

function getPoiImageCounts(mediaItems: MediaFileDto[], poiId: number) {
  return mediaItems.reduce(
    (counts, media) => {
      if (media.poiId !== poiId) {
        return counts;
      }

      counts.total += 1;
      if (media.approvalStatus === 'Pending') counts.pending += 1;
      if (media.approvalStatus === 'Approved') counts.approved += 1;
      if (media.approvalStatus === 'Rejected') counts.rejected += 1;
      return counts;
    },
    { total: 0, pending: 0, approved: 0, rejected: 0 },
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
  poi,
  isLoading,
  onChange,
  onSubmit,
}: {
  form: { title: string; languageCode: string; textContent: string; voice: string };
  poi: PoiDto | null;
  isLoading: boolean;
  onChange: (form: { title: string; languageCode: string; textContent: string; voice: string }) => void;
  onSubmit: (event: FormEvent<HTMLFormElement>) => void;
}) {
  return (
    <form className="rounded-xl border border-gray-100 bg-white p-4 shadow-sm" onSubmit={onSubmit}>
      <div className="mb-4 rounded-lg bg-gray-50 px-4 py-3 text-sm">
        <p className="font-semibold text-gray-900">
          {poi ? poi.name || poi.displayName || poi.code : 'Chưa chọn POI/sạp'}
        </p>
        <p className="text-xs text-gray-500">
          {poi ? poi.code : 'Chọn POI/sạp ở phần chọn POI phía trên.'}
        </p>
      </div>
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
          <Button type="submit" isLoading={isLoading} disabled={!poi}>
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
  canUploadAudio,
  onApprove,
  onReject,
  onView,
  onUploadAudio,
}: {
  drafts: NarrationDraftDto[];
  isLoading: boolean;
  isVendor: boolean;
  busyId: number | null;
  canUploadAudio: boolean;
  onApprove: (draft: NarrationDraftDto) => void;
  onReject: (draft: NarrationDraftDto) => void;
  onView: (draft: NarrationDraftDto) => void;
  onUploadAudio: (draft: NarrationDraftDto) => void;
}) {
  const groupedDrafts = groupDraftsByPoi(drafts);

  return (
    <div className="overflow-hidden rounded-xl border border-gray-100 bg-white shadow-sm">
      <div className="overflow-x-auto">
        <table className="min-w-full divide-y divide-gray-100 text-sm">
          <thead className="bg-gray-50 text-left text-xs font-semibold uppercase text-gray-500">
            <tr>
              <th className="px-4 py-3">POI/sạp</th>
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
                <td className="px-4 py-6 text-center text-gray-600" colSpan={isVendor ? 7 : 8}>
                  Đang tải bản thuyết minh...
                </td>
              </tr>
            ) : null}
            {!isLoading && drafts.length === 0 ? (
              <tr>
                <td className="px-4 py-6 text-center text-gray-600" colSpan={isVendor ? 7 : 8}>
                  Không có bản thuyết minh nào.
                </td>
              </tr>
            ) : null}
            {groupedDrafts.flatMap((group) => [
                <tr key={`group-${group.key}`} className="bg-gray-50/70">
                  <td className="px-4 py-2 text-xs font-semibold uppercase text-gray-500" colSpan={isVendor ? 7 : 8}>
                    {group.label}
                  </td>
                </tr>,
                ...group.items.map((draft) => (
                  <tr key={draft.id}>
                    <td className="px-4 py-3 text-gray-700">
                      <p className="font-medium text-gray-900">{draft.poiName || draft.poiCode || `POI #${draft.poiId}`}</p>
                      <p className="text-xs text-gray-500">{draft.poiCode ?? `#${draft.poiId}`}</p>
                    </td>
                    <td className="max-w-[260px] px-4 py-3">
                      <p className="font-medium text-gray-900">{draft.title}</p>
                      <p className="line-clamp-2 text-xs text-gray-500">{draft.textContent}</p>
                      {draft.simulatedAudioUrl ? (
                        <p className="mt-1 text-xs text-blue-600">
                          TTS mô phỏng / chưa kết nối dịch vụ thật
                        </p>
                      ) : null}
                      {draft.generatedAudioTrackId ? (
                        <p className="mt-1 text-xs font-medium text-emerald-700">
                          Đã có audio • AudioTrack #{draft.generatedAudioTrackId} • {formatAudioDuration(draft.generatedAudioDurationSeconds)} • {formatLanguageLabel(draft.languageCode)}
                        </p>
                      ) : null}
                    </td>
                    <td className="px-4 py-3 text-gray-600">{formatLanguageLabel(draft.languageCode)}</td>
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
                          <Button variant="ghost" size="sm" onClick={() => onView(draft)}>
                            Xem nội dung
                          </Button>
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
                          {canUploadAudio && (draft.status === 'Approved' || draft.status === 'AudioGenerated') ? (
                            <Button
                              size="sm"
                              isLoading={busyId === draft.id}
                              onClick={() => onUploadAudio(draft)}
                            >
                              Tải MP3
                            </Button>
                          ) : null}
                        </div>
                      </td>
                    ) : null}
                  </tr>
                )),
              ])}
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

function groupDraftsByPoi(drafts: NarrationDraftDto[]) {
  const groups = new Map<string, { key: string; label: string; items: NarrationDraftDto[] }>();

  for (const draft of drafts) {
    const key = String(draft.poiId);
    const label = draft.poiName || draft.poiCode || `POI #${draft.poiId}`;
    const group = groups.get(key);
    if (group) {
      group.items.push(draft);
    } else {
      groups.set(key, { key, label, items: [draft] });
    }
  }

  return Array.from(groups.values());
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

function NarrationTextModal({
  draft,
  onClose,
}: {
  draft: NarrationDraftDto | null;
  onClose: () => void;
}) {
  const [copied, setCopied] = useState(false);

  const handleCopy = async () => {
    if (!draft) return;

    await navigator.clipboard.writeText(draft.textContent);
    setCopied(true);
    window.setTimeout(() => setCopied(false), 1600);
  };

  return (
    <Modal open={Boolean(draft)} onClose={onClose} title="Nội dung thuyết minh">
      {draft ? (
        <div className="space-y-4">
          <div className="rounded-lg bg-gray-50 px-4 py-3 text-sm">
            <p className="font-semibold text-gray-900">{draft.title}</p>
            <p className="text-xs text-gray-500">
              {draft.poiName || draft.poiCode || `POI #${draft.poiId}`} • {formatLanguageLabel(draft.languageCode)}
            </p>
          </div>
          <textarea
            readOnly
            value={draft.textContent}
            rows={10}
            className="w-full rounded-md border border-gray-300 bg-white px-3 py-2 text-sm leading-6 text-gray-800 shadow-sm focus:outline-none"
          />
          <div className="flex justify-end gap-2">
            <Button variant="secondary" onClick={onClose}>
              Đóng
            </Button>
            <Button onClick={handleCopy}>
              {copied ? 'Đã sao chép' : 'Sao chép nội dung'}
            </Button>
          </div>
        </div>
      ) : null}
    </Modal>
  );
}

function UploadNarrationAudioModal({
  draft,
  isLoading,
  onClose,
  onSubmit,
}: {
  draft: NarrationDraftDto | null;
  isLoading: boolean;
  onClose: () => void;
  onSubmit: (file: File, title?: string) => void;
}) {
  const [file, setFile] = useState<File | null>(null);
  const [title, setTitle] = useState('');
  const [error, setError] = useState<string | null>(null);

  const handleSubmit = () => {
    setError(null);
    if (!file) {
      setError('Vui lòng chọn file MP3.');
      return;
    }

    if (!file.name.toLowerCase().endsWith('.mp3')) {
      setError('Chỉ hỗ trợ file .mp3.');
      return;
    }

    onSubmit(file, title.trim() || undefined);
  };

  const handleClose = () => {
    setFile(null);
    setTitle('');
    setError(null);
    onClose();
  };

  return (
    <Modal open={Boolean(draft)} onClose={handleClose} title="Tải MP3 cho thuyết minh" scrollable>
      {draft ? (
        <div className="space-y-4">
          <div className="rounded-lg bg-gray-50 px-4 py-3 text-sm">
            <p className="font-semibold text-gray-900">{draft.title}</p>
            <p className="text-xs text-gray-500">
              {draft.poiName || draft.poiCode || `POI #${draft.poiId}`} • {formatLanguageLabel(draft.languageCode)}
            </p>
          </div>
          <div>
            <label htmlFor="upload-audio-narration-text" className="mb-1 block text-sm font-medium text-gray-700">
              Nội dung để tạo MP3
            </label>
            <textarea
              id="upload-audio-narration-text"
              readOnly
              value={draft.textContent}
              rows={6}
              className="w-full rounded-md border border-gray-300 bg-white px-3 py-2 text-sm leading-6 text-gray-800 shadow-sm focus:outline-none"
            />
          </div>
          {error ? <Alert variant="error" message={error} /> : null}
          <Input
            id="audio-title"
            label="Tiêu đề audio"
            placeholder={draft.title}
            value={title}
            onChange={(event) => setTitle(event.target.value)}
          />
          <p className="rounded-md border border-blue-100 bg-blue-50 px-3 py-2 text-sm text-blue-800">
            Thời lượng sẽ được tự động nhận diện sau khi tải lên.
          </p>
          <div>
            <label htmlFor="audio-file" className="mb-1 block text-sm font-medium text-gray-700">
              File MP3
            </label>
            <input
              id="audio-file"
              type="file"
              accept=".mp3,audio/mpeg"
              onChange={(event) => setFile(event.target.files?.[0] ?? null)}
              className="block w-full cursor-pointer text-sm text-gray-500 file:mr-4 file:rounded-md file:border-0 file:bg-blue-50 file:px-4 file:py-2 file:text-sm file:font-semibold file:text-blue-700 hover:file:bg-blue-100"
            />
          </div>
          <div className="flex justify-end gap-2">
            <Button variant="secondary" onClick={handleClose}>
              Hủy
            </Button>
            <Button isLoading={isLoading} onClick={handleSubmit}>
              Tải MP3
            </Button>
          </div>
        </div>
      ) : null}
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
        <SecureImage
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
    if (typeof value === 'object' && value !== null && 'draft' in value) {
      const draft = (value as { draft?: { id?: unknown } }).draft;
      if (typeof draft?.id === 'number') return draft.id;
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

function formatAudioDuration(durationSeconds?: number | null): string {
  if (!durationSeconds || durationSeconds <= 0) {
    return 'Chưa rõ thời lượng';
  }

  const minutes = Math.floor(durationSeconds / 60);
  const seconds = durationSeconds % 60;
  return `${minutes}:${seconds.toString().padStart(2, '0')}`;
}

function getErrorMessage(error: unknown, fallback: string): string | null {
  if (!error) return null;
  if (error instanceof ApiClientError) return error.message;
  return fallback;
}
