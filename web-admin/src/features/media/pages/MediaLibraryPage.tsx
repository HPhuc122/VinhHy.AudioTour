import { useEffect, useMemo, useRef, useState, type ChangeEvent, type FormEvent, type ReactNode } from 'react';
import { useMutation, useQuery, useQueryClient } from '@tanstack/react-query';
import { useSearchParams } from 'react-router-dom';
import { extractApiError } from '@/api/apiError';
import { Alert } from '@/components/ui/Alert';
import { Button } from '@/components/ui/Button';
import { Card } from '@/components/ui/Card';
import { Input } from '@/components/ui/Input';
import { Modal } from '@/components/ui/Modal';
import { SecureImage } from '@/components/ui/SecureImage';
import { Select } from '@/components/ui/Select';
import { CmsAudioPreviewPlayer } from '@/features/audio/components/CmsAudioPreviewPlayer';
import { useAuth } from '@/features/auth/context/AuthContext';
import { ROLE_VENDOR, isAdminRole } from '@/features/auth/roleAccess';
import { languagesApi, type LanguageDto } from '@/features/languages/api/languagesApi';
import { formatLanguageLabel, languageOptions } from '@/features/languages/utils/languageLabels';
import {
  createMediaApi,
  getMediaUrl,
  type ApprovalStatus,
  type MediaFileDto,
} from '@/features/media/api/mediaApi';
import { mediaQueryKeys } from '@/features/media/hooks/useMediaQuery';
import { useUploadMediaMutation } from '@/features/media/hooks/useUploadMediaMutation';
import {
  createNarrationsApi,
  type NarrationDraftDto,
  type NarrationStatus,
} from '@/features/narrations/api/narrationsApi';
import { narrationQueryKeys } from '@/features/narrations/hooks/useNarrationsQuery';
import { poiTranslationsApi, type TranslationProviderStatus } from '@/features/pois/api/poiTranslationsApi';
import { createPoisApi, type PoiDto } from '@/features/pois/api/poisApi';

const imageAccept = '.jpg,.jpeg,.png,.webp,image/jpeg,image/png,image/webp';
const contentPageSize = 500;

type WorkspaceTab = 'overview' | 'images' | 'narrations' | 'audio' | 'translations';
type RejectTarget = { type: 'image'; item: MediaFileDto } | { type: 'narration'; item: NarrationDraftDto };

type Translation = {
  id?: number;
  languageCode: string;
  name: string;
  shortDescription: string;
  description: string;
};

const workspaceTabs: Array<{ key: WorkspaceTab; label: string }> = [
  { key: 'overview', label: 'Tổng quan' },
  { key: 'images', label: 'Hình ảnh' },
  { key: 'narrations', label: 'Bản thuyết minh' },
  { key: 'audio', label: 'Âm thanh' },
  { key: 'translations', label: 'Bản dịch' },
];

const emptyTranslation: Translation = {
  languageCode: '',
  name: '',
  shortDescription: '',
  description: '',
};

const voiceOptions = [
  { value: 'female-north', label: 'Nữ miền Bắc' },
  { value: 'female-south', label: 'Nữ miền Nam' },
  { value: 'male-north', label: 'Nam miền Bắc' },
  { value: 'male-south', label: 'Nam miền Nam' },
];

export function MediaLibraryPage() {
  const { user, httpClient } = useAuth();
  const isVendor = user?.role === ROLE_VENDOR;
  const canReviewContent = isAdminRole(user?.role);
  const canUploadNarrationAudio = isAdminRole(user?.role);
  const canUploadImages = isVendor || isAdminRole(user?.role);
  const canCreateNarration = isVendor;
  const queryClient = useQueryClient();
  const mediaApi = useMemo(() => createMediaApi(httpClient), [httpClient]);
  const narrationsApi = useMemo(() => createNarrationsApi(httpClient), [httpClient]);
  const poisApi = useMemo(() => createPoisApi(httpClient), [httpClient]);
  const [searchParams, setSearchParams] = useSearchParams();

  const [activeTab, setActiveTab] = useState<WorkspaceTab>(() => normalizeWorkspaceTab(searchParams.get('tab')));
  const [poiSearch, setPoiSearch] = useState('');
  const [selectedPoi, setSelectedPoi] = useState<PoiDto | null>(null);
  const [notice, setNotice] = useState<string | null>(null);
  const [previewMedia, setPreviewMedia] = useState<MediaFileDto | null>(null);
  const [rejectTarget, setRejectTarget] = useState<RejectTarget | null>(null);
  const [rejectReason, setRejectReason] = useState('');
  const [viewNarration, setViewNarration] = useState<NarrationDraftDto | null>(null);
  const [uploadAudioDraft, setUploadAudioDraft] = useState<NarrationDraftDto | null>(null);
  const [translateNarrationDraft, setTranslateNarrationDraft] = useState<NarrationDraftDto | null>(null);
  const [narrationTargetLanguageCodes, setNarrationTargetLanguageCodes] = useState<string[]>([]);
  const [overwriteNarrations, setOverwriteNarrations] = useState(false);
  const [draftForm, setDraftForm] = useState({
    title: '',
    languageCode: 'vi',
    textContent: '',
    voice: 'female-south',
  });
  const [translationForm, setTranslationForm] = useState<Translation | null>(null);
  const [sourceLanguageCode, setSourceLanguageCode] = useState('vi');
  const [targetLanguageCodes, setTargetLanguageCodes] = useState<string[]>([]);
  const [overwriteExisting, setOverwriteExisting] = useState(false);
  const imageInputRef = useRef<HTMLInputElement | null>(null);

  const requestedPoiId = Number(searchParams.get('poiId'));
  const poiFilter = useMemo(
    () => ({
      page: 1,
      pageSize: contentPageSize,
      search: poiSearch.trim() || undefined,
      includeDeleted: false,
    }),
    [poiSearch],
  );

  const poisQuery = useQuery({
    queryKey: ['content-workspace', 'pois', poiFilter],
    queryFn: () => poisApi.getPois(poiFilter),
  });

  const pois = poisQuery.data?.items ?? [];
  const currentPoi =
    selectedPoi ??
    pois.find((poi) => Number.isInteger(requestedPoiId) && requestedPoiId > 0 && poi.id === requestedPoiId) ??
    null;
  const selectedPoiId = currentPoi?.id;

  const imagesQuery = useQuery({
    queryKey: ['content-workspace', 'media-by-poi', selectedPoiId],
    queryFn: () =>
      selectedPoiId
        ? mediaApi.getMediaByPoi(selectedPoiId, { page: 1, pageSize: contentPageSize, approvalStatus: 'all' })
        : Promise.resolve({ items: [], page: 1, pageSize: contentPageSize, totalCount: 0, totalPages: 0 }),
    enabled: Boolean(selectedPoiId),
  });

  const narrationsQuery = useQuery({
    queryKey: ['content-workspace', 'narrations-by-poi', selectedPoiId],
    queryFn: () =>
      selectedPoiId
        ? narrationsApi.getNarrationsByPoi(selectedPoiId, { page: 1, pageSize: contentPageSize, status: 'all' })
        : Promise.resolve({ items: [], page: 1, pageSize: contentPageSize, totalCount: 0, totalPages: 0 }),
    enabled: Boolean(selectedPoiId),
  });

  const translationsQuery = useQuery({
    queryKey: ['content-workspace', 'translations-by-poi', selectedPoiId],
    queryFn: () => poiTranslationsApi.getByPoiId(selectedPoiId!),
    enabled: Boolean(selectedPoiId),
  });

  const languagesQuery = useQuery({
    queryKey: ['languages'],
    queryFn: languagesApi.getAll,
  });

  const translationProviderQuery = useQuery({
    queryKey: ['poiTranslations', 'provider'],
    queryFn: poiTranslationsApi.getProviderStatus,
  });

  const images = imagesQuery.data?.items ?? [];
  const narrations = narrationsQuery.data?.items ?? [];
  const translations = (translationsQuery.data ?? []) as Translation[];
  const languages = languagesQuery.data ?? [];
  const translationProviderStatus = translationProviderQuery.data;
  const activeLanguages = useMemo(() => languages.filter((language) => language.isActive), [languages]);
  const contentSummary = useMemo(
    () => buildContentSummary(images, narrations, translations),
    [images, narrations, translations],
  );

  useEffect(() => {
    setActiveTab(normalizeWorkspaceTab(searchParams.get('tab')));
  }, [searchParams]);

  useEffect(() => {
    if (!pois.length || selectedPoi) return;

    if (Number.isInteger(requestedPoiId) && requestedPoiId > 0) {
      const poiFromUrl = pois.find((poi) => poi.id === requestedPoiId);
      if (poiFromUrl) {
        setSelectedPoi(poiFromUrl);
        return;
      }
    }

    if (isVendor && pois.length === 1) {
      setSelectedPoi(pois[0]!);
    }
  }, [isVendor, pois, requestedPoiId, selectedPoi]);

  useEffect(() => {
    setTranslationForm(null);
    setTargetLanguageCodes([]);
    setOverwriteExisting(false);
  }, [selectedPoiId]);

  const updateWorkspaceQuery = (updates: { tab?: WorkspaceTab; poiId?: number | null }) => {
    const nextParams = new URLSearchParams(searchParams);
    if (updates.tab) {
      nextParams.set('tab', updates.tab);
    }
    if (typeof updates.poiId !== 'undefined') {
      if (updates.poiId) {
        nextParams.set('poiId', String(updates.poiId));
      } else {
        nextParams.delete('poiId');
      }
    }
    setSearchParams(nextParams);
  };

  const selectPoi = (poi: PoiDto | null) => {
    setSelectedPoi(poi);
    setNotice(null);
    updateWorkspaceQuery({ poiId: poi?.id ?? null });
  };

  const selectTab = (tab: WorkspaceTab) => {
    setActiveTab(tab);
    updateWorkspaceQuery({ tab });
  };

  const invalidateSelectedPoiContent = async () => {
    await Promise.all([
      queryClient.invalidateQueries({ queryKey: ['content-workspace', 'media-by-poi', selectedPoiId] }),
      queryClient.invalidateQueries({ queryKey: ['content-workspace', 'narrations-by-poi', selectedPoiId] }),
      queryClient.invalidateQueries({ queryKey: ['content-workspace', 'translations-by-poi', selectedPoiId] }),
      queryClient.invalidateQueries({ queryKey: ['cms-audio-preview', 'poi', selectedPoiId] }),
      queryClient.invalidateQueries({ queryKey: mediaQueryKeys.all }),
      queryClient.invalidateQueries({ queryKey: narrationQueryKeys.all }),
    ]);
  };

  const uploadMutation = useUploadMediaMutation();
  const approveImageMutation = useMutation({
    mutationFn: (id: number) => mediaApi.approveMedia(id),
    onSuccess: async () => {
      setNotice('Đã duyệt ảnh.');
      await invalidateSelectedPoiContent();
    },
  });
  const rejectImageMutation = useMutation({
    mutationFn: ({ id, reason }: { id: number; reason: string }) => mediaApi.rejectMedia(id, reason),
    onSuccess: async () => {
      setNotice('Đã từ chối ảnh.');
      setRejectTarget(null);
      setRejectReason('');
      await invalidateSelectedPoiContent();
    },
  });
  const createNarrationMutation = useMutation({
    mutationFn: () => {
      if (!currentPoi) {
        throw new Error('Vui lòng chọn POI/sạp trước khi tạo bản thuyết minh.');
      }

      return narrationsApi.createNarration({ ...draftForm, poiId: currentPoi.id });
    },
    onSuccess: async () => {
      setNotice('Đã gửi bản thuyết minh chờ duyệt.');
      setDraftForm({ title: '', languageCode: 'vi', textContent: '', voice: 'female-south' });
      await invalidateSelectedPoiContent();
    },
  });
  const approveNarrationMutation = useMutation({
    mutationFn: (id: number) => narrationsApi.approveNarration(id),
    onSuccess: async () => {
      setNotice('Đã duyệt bản thuyết minh.');
      await invalidateSelectedPoiContent();
    },
  });
  const rejectNarrationMutation = useMutation({
    mutationFn: ({ id, reason }: { id: number; reason: string }) => narrationsApi.rejectNarration(id, reason),
    onSuccess: async () => {
      setNotice('Đã từ chối bản thuyết minh.');
      setRejectTarget(null);
      setRejectReason('');
      await invalidateSelectedPoiContent();
    },
  });
  const uploadNarrationAudioMutation = useMutation({
    mutationFn: ({ draft, file, title }: { draft: NarrationDraftDto; file: File; title?: string }) =>
      narrationsApi.uploadAudio(draft.id, { file, title }),
    onSuccess: async () => {
      setNotice('Đã tải MP3 và gắn audio cho bản thuyết minh.');
      setUploadAudioDraft(null);
      await invalidateSelectedPoiContent();
    },
  });
  const generateNarrationTranslationsMutation = useMutation({
    mutationFn: () => {
      if (!translateNarrationDraft) {
        throw new Error('Vui lòng chọn bản thuyết minh nguồn.');
      }

      return narrationsApi.generateTranslations(translateNarrationDraft.id, {
        targetLanguageCodes: narrationTargetLanguageCodes,
        overwriteExisting: overwriteNarrations,
      });
    },
    onSuccess: async (result) => {
      const skipped = result.skippedLanguageCodes.length
        ? ` Bỏ qua: ${result.skippedLanguageCodes.join(', ')}.`
        : '';
      setNotice(`Đã tạo ${result.narrations.length} bản thuyết minh đã dịch.${skipped}`);
      setTranslateNarrationDraft(null);
      setNarrationTargetLanguageCodes([]);
      setOverwriteNarrations(false);
      await invalidateSelectedPoiContent();
    },
  });
  const saveTranslationMutation = useMutation({
    mutationFn: (payload: Translation) => {
      if (!currentPoi) {
        throw new Error('Vui lòng chọn POI/sạp trước khi lưu bản dịch.');
      }

      return payload.id
        ? poiTranslationsApi.update(currentPoi.id, payload.id, payload)
        : poiTranslationsApi.create(currentPoi.id, payload);
    },
    onSuccess: async () => {
      setNotice('Đã lưu bản dịch.');
      setTranslationForm(null);
      await invalidateSelectedPoiContent();
    },
  });
  const deleteTranslationMutation = useMutation({
    mutationFn: (translationId: number) => poiTranslationsApi.delete(currentPoi!.id, translationId),
    onSuccess: async () => {
      setNotice('Đã xóa bản dịch.');
      await invalidateSelectedPoiContent();
    },
  });
  const generateTranslationsMutation = useMutation({
    mutationFn: () => {
      if (!currentPoi) {
        throw new Error('Vui lòng chọn POI/sạp trước khi tạo bản dịch.');
      }
      return poiTranslationsApi.generate({
        poiId: currentPoi.id,
        sourceLanguageCode,
        targetLanguageCodes,
        overwriteExisting,
      });
    },
    onSuccess: async (result: any) => {
      const skipped = result?.skippedLanguageCodes?.length
        ? ` Bỏ qua: ${result.skippedLanguageCodes.join(', ')}.`
        : '';
      setNotice(`Đã tạo ${getGeneratedTranslationLabel(translationProviderStatus)}.${skipped}`);
      setTargetLanguageCodes([]);
      await invalidateSelectedPoiContent();
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

    setNotice(isVendor ? `Đã gửi ${files.length} ảnh chờ duyệt.` : `Đã tải lên ${files.length} ảnh.`);
    await invalidateSelectedPoiContent();
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

    if (rejectTarget?.type === 'image') {
      rejectImageMutation.mutate({ id: rejectTarget.item.id, reason });
    }

    if (rejectTarget?.type === 'narration') {
      rejectNarrationMutation.mutate({ id: rejectTarget.item.id, reason });
    }
  };

  const handleSaveTranslation = () => {
    if (!translationForm) return;
    const payload = {
      ...translationForm,
      name: translationForm.name.trim(),
      shortDescription: translationForm.shortDescription.trim(),
      description: translationForm.description.trim(),
    };

    if (!payload.languageCode) {
      setNotice('Vui lòng chọn ngôn ngữ cho bản dịch.');
      return;
    }

    if (!payload.name) {
      setNotice('Vui lòng nhập tên bản dịch.');
      return;
    }

    if (!payload.description) {
      setNotice('Vui lòng nhập mô tả bản dịch.');
      return;
    }

    saveTranslationMutation.mutate(payload);
  };

  const handleDeleteTranslation = (translation: Translation) => {
    if (!translation.id) return;
    const ok = window.confirm(`Xóa bản dịch ${formatTranslationLanguage(translation.languageCode, languages)}?`);
    if (ok) {
      deleteTranslationMutation.mutate(translation.id);
    }
  };

  const handleGenerateTranslations = () => {
    if (targetLanguageCodes.length === 0) {
      setNotice('Vui lòng chọn ít nhất một ngôn ngữ đích.');
      return;
    }

    generateTranslationsMutation.mutate();
  };

  const mutationError = getFirstError([
    uploadMutation.error,
    approveImageMutation.error,
    rejectImageMutation.error,
    createNarrationMutation.error,
    approveNarrationMutation.error,
    rejectNarrationMutation.error,
    uploadNarrationAudioMutation.error,
    generateNarrationTranslationsMutation.error,
    saveTranslationMutation.error,
    deleteTranslationMutation.error,
    generateTranslationsMutation.error,
  ]);
  const queryError = getFirstError([
    poisQuery.error,
    imagesQuery.error,
    narrationsQuery.error,
    translationsQuery.error,
    languagesQuery.error,
    translationProviderQuery.error,
  ]);

  return (
    <section className="app-page">
      <div className="app-page-header">
        <div>
          <h1 className="app-title">Không gian nội dung POI</h1>
          <p className="app-subtitle">
            Chọn một POI/sạp để quản lý hình ảnh, bản thuyết minh, âm thanh bảo vệ và bản dịch theo cùng một luồng.
          </p>
        </div>
      </div>

      {notice ? <Alert message={notice} /> : null}
      {queryError ? <Alert variant="error" message={queryError} /> : null}
      {mutationError ? <Alert variant="error" message={mutationError} /> : null}

      <PoiWorkspaceSelector
        pois={pois}
        selectedPoi={currentPoi}
        search={poiSearch}
        isVendor={isVendor}
        isLoading={poisQuery.isLoading}
        onSearchChange={setPoiSearch}
        onSelect={selectPoi}
      />

      {!currentPoi ? (
        <EmptyWorkspace isVendor={isVendor} />
      ) : (
        <>
          <PoiContentHeader poi={currentPoi} summary={contentSummary} />

          <div className="flex flex-wrap gap-2 border-b border-gray-200">
            {workspaceTabs.map((tab) => (
              <TabButton key={tab.key} active={activeTab === tab.key} onClick={() => selectTab(tab.key)}>
                {tab.label}
              </TabButton>
            ))}
          </div>

          {activeTab === 'overview' ? (
            <OverviewTab
              poi={currentPoi}
              summary={contentSummary}
              narrations={narrations}
              translations={translations}
              isVendor={isVendor}
              onOpenTab={selectTab}
            />
          ) : null}

          {activeTab === 'images' ? (
            <ImagesTab
              poi={currentPoi}
              images={images}
              isLoading={imagesQuery.isLoading}
              isVendor={isVendor}
              canUpload={canUploadImages}
              canReview={canReviewContent}
              imageInputRef={imageInputRef}
              uploadLoading={uploadMutation.isPending}
              busyId={getBusyMutationId(
                approveImageMutation.isPending ? approveImageMutation.variables : undefined,
                rejectImageMutation.isPending ? rejectImageMutation.variables : undefined,
              )}
              onUpload={handleUploadImages}
              onPreview={setPreviewMedia}
              onApprove={(media) => approveImageMutation.mutate(media.id)}
              onReject={(media) => {
                setRejectTarget({ type: 'image', item: media });
                setRejectReason('');
              }}
            />
          ) : null}

          {activeTab === 'narrations' ? (
            <NarrationsTab
              poi={currentPoi}
              drafts={narrations}
              isLoading={narrationsQuery.isLoading}
              isVendor={isVendor}
              canCreate={canCreateNarration}
              canReview={canReviewContent}
              form={draftForm}
              createLoading={createNarrationMutation.isPending}
              busyId={getBusyMutationId(
                approveNarrationMutation.isPending ? approveNarrationMutation.variables : undefined,
                rejectNarrationMutation.isPending ? rejectNarrationMutation.variables : undefined,
              )}
              onFormChange={setDraftForm}
              onSubmit={handleSubmitNarration}
              onApprove={(draft) => approveNarrationMutation.mutate(draft.id)}
              onReject={(draft) => {
                setRejectTarget({ type: 'narration', item: draft });
                setRejectReason('');
              }}
              onView={setViewNarration}
              onTranslate={(draft) => {
                setTranslateNarrationDraft(draft);
                setNarrationTargetLanguageCodes([]);
                setOverwriteNarrations(false);
              }}
            />
          ) : null}

          {activeTab === 'audio' ? (
            <AudioTab
              poi={currentPoi}
              drafts={narrations}
              isLoading={narrationsQuery.isLoading}
              canUploadAudio={canUploadNarrationAudio}
              isVendor={isVendor}
              busyId={getBusyMutationId(
                uploadNarrationAudioMutation.isPending ? uploadNarrationAudioMutation.variables : undefined,
              )}
              onUploadAudio={setUploadAudioDraft}
            />
          ) : null}

          {activeTab === 'translations' ? (
            <TranslationsTab
              poi={currentPoi}
              translations={translations}
              languages={languages}
              activeLanguages={activeLanguages}
              isLoading={translationsQuery.isLoading || languagesQuery.isLoading}
              isVendor={isVendor}
              form={translationForm}
              setForm={setTranslationForm}
              sourceLanguageCode={sourceLanguageCode}
              setSourceLanguageCode={setSourceLanguageCode}
              targetLanguageCodes={targetLanguageCodes}
              setTargetLanguageCodes={setTargetLanguageCodes}
              overwriteExisting={overwriteExisting}
              setOverwriteExisting={setOverwriteExisting}
              translationProviderStatus={translationProviderStatus}
              isSaving={saveTranslationMutation.isPending}
              isDeleting={deleteTranslationMutation.isPending}
              isGenerating={generateTranslationsMutation.isPending}
              onSave={handleSaveTranslation}
              onDelete={handleDeleteTranslation}
              onGenerate={handleGenerateTranslations}
            />
          ) : null}
        </>
      )}

      <MediaPreviewModal media={previewMedia} onClose={() => setPreviewMedia(null)} />
      <RejectModal
        open={Boolean(rejectTarget)}
        title={rejectTarget?.type === 'image' ? 'Lý do từ chối ảnh' : 'Lý do từ chối bản thuyết minh'}
        reason={rejectReason}
        isLoading={rejectImageMutation.isPending || rejectNarrationMutation.isPending}
        onReasonChange={setRejectReason}
        onClose={() => {
          setRejectTarget(null);
          setRejectReason('');
        }}
        onSubmit={handleSubmitReject}
      />
      <NarrationTextModal draft={viewNarration} onClose={() => setViewNarration(null)} />
      <TranslateNarrationModal
        draft={translateNarrationDraft}
        narrations={narrations}
        languages={activeLanguages}
        targetLanguageCodes={narrationTargetLanguageCodes}
        overwriteExisting={overwriteNarrations}
        isLoading={generateNarrationTranslationsMutation.isPending}
        onTargetLanguageCodesChange={setNarrationTargetLanguageCodes}
        onOverwriteExistingChange={setOverwriteNarrations}
        onClose={() => {
          setTranslateNarrationDraft(null);
          setNarrationTargetLanguageCodes([]);
          setOverwriteNarrations(false);
        }}
        onSubmit={() => generateNarrationTranslationsMutation.mutate()}
      />
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

function PoiWorkspaceSelector({
  pois,
  selectedPoi,
  search,
  isVendor,
  isLoading,
  onSearchChange,
  onSelect,
}: {
  pois: PoiDto[];
  selectedPoi: PoiDto | null;
  search: string;
  isVendor: boolean;
  isLoading: boolean;
  onSearchChange: (value: string) => void;
  onSelect: (poi: PoiDto | null) => void;
}) {
  const options = [
    { value: '', label: isLoading ? 'Đang tải POI/sạp...' : 'Chọn POI/sạp...' },
    ...pois.map((poi) => ({
      value: String(poi.id),
      label: `${poi.name || poi.displayName || poi.code} (${poi.code})`,
    })),
  ];

  return (
    <Card className="p-4">
      <div className="grid gap-3 lg:grid-cols-[1fr_320px]">
        <Input
          id="content-poi-search"
          label="Tìm kiếm POI/sạp"
          placeholder="Tên hoặc mã POI/sạp"
          value={search}
          onChange={(event) => onSearchChange(event.target.value)}
        />
        <Select
          id="content-poi-select"
          label={isVendor ? 'Sạp của tôi' : 'POI/sạp đang chọn'}
          value={selectedPoi ? String(selectedPoi.id) : ''}
          options={options}
          onChange={(event) => {
            const poiId = Number(event.target.value);
            onSelect(pois.find((poi) => poi.id === poiId) ?? null);
          }}
        />
      </div>
      {selectedPoi ? (
        <div className="mt-4 flex flex-wrap gap-2">
          <StatusPill tone="blue">{getLifecycleLabel(selectedPoi.lifecycleStatus)}</StatusPill>
          <StatusPill tone="amber">{getPaymentLabel(selectedPoi.paymentStatus)}</StatusPill>
          <StatusPill tone={getPublicVisibilityStatus(selectedPoi).isPublic ? 'green' : 'gray'}>
            {getPublicVisibilityStatus(selectedPoi).label}
          </StatusPill>
        </div>
      ) : (
        <p className="mt-3 text-sm text-gray-500">
          {isVendor
            ? 'Danh sách này chỉ hiển thị POI/sạp thuộc tài khoản của bạn.'
            : 'Admin có thể chọn bất kỳ POI/sạp nào để kiểm tra nội dung và duyệt hàng chờ.'}
        </p>
      )}
    </Card>
  );
}

function EmptyWorkspace({ isVendor }: { isVendor: boolean }) {
  return (
    <Card className="p-8 text-center">
      <h2 className="text-lg font-semibold text-gray-900">Chưa chọn POI/sạp</h2>
      <p className="mx-auto mt-2 max-w-xl text-sm leading-6 text-gray-600">
        {isVendor
          ? 'Chọn sạp của bạn để tải ảnh, tạo bản thuyết minh và bổ sung bản dịch.'
          : 'Chọn một POI/sạp ở phía trên để mở không gian nội dung, xem hàng chờ duyệt và quản lý audio.'}
      </p>
    </Card>
  );
}

function PoiContentHeader({ poi, summary }: { poi: PoiDto; summary: ContentSummary }) {
  const publicStatus = getPublicVisibilityStatus(poi);

  return (
    <Card className="p-5">
      <div className="flex flex-col gap-4 lg:flex-row lg:items-start lg:justify-between">
        <div>
          <p className="text-xs font-semibold uppercase tracking-wide text-gray-500">{poi.code}</p>
          <h2 className="mt-1 text-2xl font-bold text-gray-900">{poi.name || poi.displayName || poi.code}</h2>
          <p className="mt-1 text-sm text-gray-500">{poi.category || 'Chưa phân loại'}</p>
        </div>
        <div className="flex flex-wrap gap-2">
          <StatusPill tone="blue">{getLifecycleLabel(poi.lifecycleStatus)}</StatusPill>
          <StatusPill tone="amber">{getPaymentLabel(poi.paymentStatus)}</StatusPill>
          <StatusPill tone={publicStatus.isPublic ? 'green' : 'gray'}>{publicStatus.label}</StatusPill>
        </div>
      </div>

      <div className="mt-5 grid gap-3 sm:grid-cols-2 lg:grid-cols-4">
        <MetricCard label="Ảnh đã duyệt" value={summary.images.approved} />
        <MetricCard label="Thuyết minh đã duyệt" value={summary.narrations.approved} />
        <MetricCard label="Âm thanh đã có" value={summary.audio.generated} />
        <MetricCard label="Bản dịch" value={summary.translations.total} />
      </div>
    </Card>
  );
}

function OverviewTab({
  poi,
  summary,
  narrations,
  translations,
  isVendor,
  onOpenTab,
}: {
  poi: PoiDto;
  summary: ContentSummary;
  narrations: NarrationDraftDto[];
  translations: Translation[];
  isVendor: boolean;
  onOpenTab: (tab: WorkspaceTab) => void;
}) {
  const nextAction = getRecommendedAction(summary, isVendor);
  const languageRows = buildLanguageRows(narrations, translations);

  return (
    <div className="grid gap-4 xl:grid-cols-[1.1fr_0.9fr]">
      <Card className="p-5">
        <h3 className="text-base font-semibold text-gray-900">Tình trạng nội dung</h3>
        <div className="mt-4 grid gap-3 sm:grid-cols-2">
          <SummaryLine
            label="Hình ảnh"
            value={`${summary.images.approved} đã duyệt, ${summary.images.pending} chờ duyệt, ${summary.images.rejected} bị từ chối`}
            actionLabel="Mở hình ảnh"
            onAction={() => onOpenTab('images')}
          />
          <SummaryLine
            label="Bản thuyết minh"
            value={`${summary.narrations.approved} đã duyệt, ${summary.narrations.pending} chờ duyệt`}
            actionLabel="Mở thuyết minh"
            onAction={() => onOpenTab('narrations')}
          />
          <SummaryLine
            label="Âm thanh"
            value={`${summary.audio.generated} đã có audio, ${summary.audio.missing} còn thiếu`}
            actionLabel="Mở âm thanh"
            onAction={() => onOpenTab('audio')}
          />
          <SummaryLine
            label="Bản dịch"
            value={`${summary.translations.total} ngôn ngữ đã có bản dịch`}
            actionLabel="Mở bản dịch"
            onAction={() => onOpenTab('translations')}
          />
        </div>
      </Card>

      <Card className="p-5">
        <h3 className="text-base font-semibold text-gray-900">Gợi ý bước tiếp theo</h3>
        <p className="mt-3 rounded-lg border border-blue-100 bg-blue-50 px-4 py-3 text-sm leading-6 text-blue-800">
          {nextAction}
        </p>
        <div className="mt-4 grid gap-3 text-sm text-gray-600">
          <InfoRow label="Hiển thị công khai" value={getPublicVisibilityStatus(poi).reason} />
          <InfoRow label="Ngôn ngữ có nội dung" value={languageRows.length ? `${languageRows.length} ngôn ngữ` : 'Chưa có'} />
        </div>
      </Card>

      <Card className="p-5 xl:col-span-2">
        <h3 className="text-base font-semibold text-gray-900">Nội dung theo ngôn ngữ</h3>
        <div className="mt-4 overflow-x-auto">
          <table className="min-w-full divide-y divide-gray-100 text-sm">
            <thead className="bg-gray-50 text-left text-xs font-semibold uppercase text-gray-500">
              <tr>
                <th className="px-4 py-3">Ngôn ngữ</th>
                <th className="px-4 py-3">Thuyết minh</th>
                <th className="px-4 py-3">Âm thanh</th>
                <th className="px-4 py-3">Bản dịch</th>
              </tr>
            </thead>
            <tbody className="divide-y divide-gray-100">
              {languageRows.length === 0 ? (
                <tr>
                  <td className="px-4 py-6 text-center text-gray-500" colSpan={4}>
                    Chưa có nội dung ngôn ngữ nào cho POI/sạp này.
                  </td>
                </tr>
              ) : (
                languageRows.map((row) => (
                  <tr key={row.languageCode}>
                    <td className="px-4 py-3 font-medium text-gray-900">{formatLanguageLabel(row.languageCode)}</td>
                    <td className="px-4 py-3"><NarrationStatusPill status={row.narrationStatus} /></td>
                    <td className="px-4 py-3">{row.hasAudio ? 'Đã có audio' : 'Chưa có audio'}</td>
                    <td className="px-4 py-3">{row.hasTranslation ? 'Đã có bản dịch' : 'Chưa có bản dịch'}</td>
                  </tr>
                ))
              )}
            </tbody>
          </table>
        </div>
      </Card>
    </div>
  );
}

function ImagesTab({
  poi,
  images,
  isLoading,
  isVendor,
  canUpload,
  canReview,
  imageInputRef,
  uploadLoading,
  busyId,
  onUpload,
  onPreview,
  onApprove,
  onReject,
}: {
  poi: PoiDto;
  images: MediaFileDto[];
  isLoading: boolean;
  isVendor: boolean;
  canUpload: boolean;
  canReview: boolean;
  imageInputRef: React.RefObject<HTMLInputElement | null>;
  uploadLoading: boolean;
  busyId: number | null;
  onUpload: (event: ChangeEvent<HTMLInputElement>) => void;
  onPreview: (media: MediaFileDto) => void;
  onApprove: (media: MediaFileDto) => void;
  onReject: (media: MediaFileDto) => void;
}) {
  const grouped = groupMediaByStatus(images);

  return (
    <div className="space-y-4">
      <Card className="p-4">
        <div className="flex flex-col gap-3 md:flex-row md:items-center md:justify-between">
          <div>
            <h3 className="text-base font-semibold text-gray-900">Hình ảnh của {poi.name || poi.code}</h3>
            <p className="mt-1 text-sm text-gray-500">
              Ảnh được tải qua API media và xem bằng endpoint CMS bảo vệ.
            </p>
          </div>
          {canUpload ? (
            <div>
              <input
                ref={imageInputRef}
                type="file"
                accept={imageAccept}
                multiple
                className="hidden"
                onChange={onUpload}
              />
              <Button onClick={() => imageInputRef.current?.click()} isLoading={uploadLoading}>
                Tải ảnh lên
              </Button>
            </div>
          ) : (
            <p className="text-sm text-gray-500">Admin tập trung duyệt ảnh đang chờ.</p>
          )}
        </div>
        {isVendor ? (
          <p className="mt-3 rounded-lg border border-amber-100 bg-amber-50 px-3 py-2 text-sm text-amber-800">
            Ảnh vendor tải lên sẽ ở trạng thái chờ duyệt trước khi hiển thị công khai.
          </p>
        ) : null}
      </Card>

      {isLoading ? <LoadingCard message="Đang tải hình ảnh..." /> : null}
      {!isLoading && images.length === 0 ? <EmptyCard message="Chưa có ảnh nào cho POI/sạp này." /> : null}

      {!isLoading ? (
        <div className="grid gap-4 xl:grid-cols-3">
          <ImageStatusGroup
            title="Chờ duyệt"
            mediaItems={grouped.Pending}
            tone="amber"
            canReview={canReview}
            busyId={busyId}
            onPreview={onPreview}
            onApprove={onApprove}
            onReject={onReject}
          />
          <ImageStatusGroup
            title="Đã duyệt"
            mediaItems={grouped.Approved}
            tone="green"
            canReview={canReview}
            busyId={busyId}
            onPreview={onPreview}
            onApprove={onApprove}
            onReject={onReject}
          />
          <ImageStatusGroup
            title="Bị từ chối"
            mediaItems={grouped.Rejected}
            tone="red"
            canReview={canReview}
            busyId={busyId}
            onPreview={onPreview}
            onApprove={onApprove}
            onReject={onReject}
          />
        </div>
      ) : null}
    </div>
  );
}

function NarrationsTab({
  poi,
  drafts,
  isLoading,
  isVendor,
  canCreate,
  canReview,
  form,
  createLoading,
  busyId,
  onFormChange,
  onSubmit,
  onApprove,
  onReject,
  onView,
  onTranslate,
}: {
  poi: PoiDto;
  drafts: NarrationDraftDto[];
  isLoading: boolean;
  isVendor: boolean;
  canCreate: boolean;
  canReview: boolean;
  form: { title: string; languageCode: string; textContent: string; voice: string };
  createLoading: boolean;
  busyId: number | null;
  onFormChange: (form: { title: string; languageCode: string; textContent: string; voice: string }) => void;
  onSubmit: (event: FormEvent<HTMLFormElement>) => void;
  onApprove: (draft: NarrationDraftDto) => void;
  onReject: (draft: NarrationDraftDto) => void;
  onView: (draft: NarrationDraftDto) => void;
  onTranslate: (draft: NarrationDraftDto) => void;
}) {
  return (
    <div className="space-y-4">
      {!isVendor ? (
        <Card className="border-blue-100 bg-blue-50 p-4">
          <h3 className="text-base font-semibold text-blue-950">Quy trình thuyết minh của admin</h3>
          <p className="mt-1 text-sm leading-6 text-blue-800">
            Admin duyệt nội dung vendor gửi, sao chép nội dung đã duyệt sang công cụ Text-to-Speech bên ngoài,
            rồi tải MP3 vào tab Âm thanh cho đúng POI và ngôn ngữ. Hệ thống chưa tạo TTS nội bộ.
          </p>
        </Card>
      ) : null}

      {canCreate ? (
        <NarrationForm
          form={form}
          poi={poi}
          isVendor={isVendor}
          isLoading={createLoading}
          onChange={onFormChange}
          onSubmit={onSubmit}
        />
      ) : null}

      <NarrationList
        drafts={drafts}
        isLoading={isLoading}
        canReview={canReview}
        busyId={busyId}
        onApprove={onApprove}
        onReject={onReject}
        onView={onView}
        onTranslate={onTranslate}
      />
    </div>
  );
}

function AudioTab({
  poi,
  drafts,
  isLoading,
  canUploadAudio,
  isVendor,
  busyId,
  onUploadAudio,
}: {
  poi: PoiDto;
  drafts: NarrationDraftDto[];
  isLoading: boolean;
  canUploadAudio: boolean;
  isVendor: boolean;
  busyId: number | null;
  onUploadAudio: (draft: NarrationDraftDto) => void;
}) {
  const approvedDrafts = drafts.filter((draft) => draft.status === 'Approved' || draft.status === 'AudioGenerated');

  return (
    <div className="space-y-4">
      <Card className="p-4">
        <h3 className="text-base font-semibold text-gray-900">Preview âm thanh bảo vệ</h3>
        <p className="mt-1 text-sm text-gray-500">
          CMS phát thử qua endpoint audio-preview được bảo vệ, không hiển thị đường dẫn file thô.
        </p>
        <CmsAudioPreviewPlayer poiId={poi.id} />
      </Card>

      <Card className="p-0">
        <div className="border-b border-gray-100 px-4 py-3">
          <h3 className="text-base font-semibold text-gray-900">Âm thanh theo ngôn ngữ</h3>
          {isVendor ? (
            <p className="mt-1 text-sm text-gray-500">Vendor có thể theo dõi trạng thái, MP3 do admin tải lên sau khi duyệt.</p>
          ) : (
            <p className="mt-1 text-sm text-gray-500">Admin tải MP3 sau khi bản thuyết minh đã được duyệt.</p>
          )}
        </div>
        <div className="overflow-x-auto">
          <table className="min-w-full divide-y divide-gray-100 text-sm">
            <thead className="bg-gray-50 text-left text-xs font-semibold uppercase text-gray-500">
              <tr>
                <th className="px-4 py-3">Ngôn ngữ</th>
                <th className="px-4 py-3">Bản thuyết minh</th>
                <th className="px-4 py-3">Trạng thái audio</th>
                <th className="px-4 py-3">Thời lượng</th>
                {canUploadAudio ? <th className="px-4 py-3 text-right">Thao tác</th> : null}
              </tr>
            </thead>
            <tbody className="divide-y divide-gray-100">
              {isLoading ? (
                <TableMessage colSpan={canUploadAudio ? 5 : 4} message="Đang tải trạng thái âm thanh..." />
              ) : null}
              {!isLoading && approvedDrafts.length === 0 ? (
                <TableMessage colSpan={canUploadAudio ? 5 : 4} message="Chưa có bản thuyết minh đã duyệt để gắn MP3." />
              ) : null}
              {approvedDrafts.map((draft) => (
                <tr key={draft.id}>
                  <td className="px-4 py-3 font-medium text-gray-900">{formatLanguageLabel(draft.languageCode)}</td>
                  <td className="px-4 py-3">
                    <p className="font-medium text-gray-900">{draft.title}</p>
                    <p className="line-clamp-2 text-xs text-gray-500">{draft.textContent}</p>
                  </td>
                  <td className="px-4 py-3">
                    {draft.generatedAudioTrackId ? (
                      <StatusPill tone="green">Đã có MP3</StatusPill>
                    ) : (
                      <StatusPill tone="amber">Chưa có MP3</StatusPill>
                    )}
                  </td>
                  <td className="px-4 py-3 text-gray-600">{formatAudioDuration(draft.generatedAudioDurationSeconds)}</td>
                  {canUploadAudio ? (
                    <td className="px-4 py-3 text-right">
                      <Button size="sm" isLoading={busyId === draft.id} onClick={() => onUploadAudio(draft)}>
                        {draft.generatedAudioTrackId ? 'Thay MP3' : 'Tải MP3'}
                      </Button>
                    </td>
                  ) : null}
                </tr>
              ))}
            </tbody>
          </table>
        </div>
      </Card>
    </div>
  );
}

function TranslationsTab({
  poi,
  translations,
  languages,
  activeLanguages,
  isLoading,
  isVendor,
  form,
  setForm,
  sourceLanguageCode,
  setSourceLanguageCode,
  targetLanguageCodes,
  setTargetLanguageCodes,
  overwriteExisting,
  setOverwriteExisting,
  translationProviderStatus,
  isSaving,
  isDeleting,
  isGenerating,
  onSave,
  onDelete,
  onGenerate,
}: {
  poi: PoiDto;
  translations: Translation[];
  languages: LanguageDto[];
  activeLanguages: LanguageDto[];
  isLoading: boolean;
  isVendor: boolean;
  form: Translation | null;
  setForm: (form: Translation | null) => void;
  sourceLanguageCode: string;
  setSourceLanguageCode: (code: string) => void;
  targetLanguageCodes: string[];
  setTargetLanguageCodes: (codes: string[]) => void;
  overwriteExisting: boolean;
  setOverwriteExisting: (value: boolean) => void;
  translationProviderStatus?: TranslationProviderStatus;
  isSaving: boolean;
  isDeleting: boolean;
  isGenerating: boolean;
  onSave: () => void;
  onDelete: (translation: Translation) => void;
  onGenerate: () => void;
}) {
  const translatedCodes = new Set(translations.map((translation) => translation.languageCode));
  const availableLanguages = activeLanguages.filter((language) => !translatedCodes.has(language.code));
  const targetLanguages = activeLanguages.filter(
    (language) => language.code !== sourceLanguageCode && (overwriteExisting || !translatedCodes.has(language.code)),
  );

  const startAdd = () => {
    setForm({
      ...emptyTranslation,
      languageCode: availableLanguages[0]?.code ?? '',
      name: poi.name || poi.displayName || poi.code,
      shortDescription: poi.shortDescription ?? '',
      description: poi.description ?? '',
    });
  };

  const startEdit = (translation: Translation) => {
    setForm({
      id: translation.id,
      languageCode: translation.languageCode,
      name: translation.name ?? '',
      shortDescription: translation.shortDescription ?? '',
      description: translation.description ?? '',
    });
  };

  const toggleTargetLanguage = (code: string) => {
    setTargetLanguageCodes(
      targetLanguageCodes.includes(code)
        ? targetLanguageCodes.filter((item) => item !== code)
        : [...targetLanguageCodes, code],
    );
  };

  return (
    <div className="space-y-4">
      <Card className="p-4">
        <div className="flex flex-col gap-3 lg:flex-row lg:items-start lg:justify-between">
          <div>
            <h3 className="text-base font-semibold text-gray-900">Bản dịch POI</h3>
            <p className="mt-1 text-sm text-gray-500">
              {isVendor
                ? 'Bổ sung bản dịch cho sạp của bạn theo từng ngôn ngữ.'
                : 'Admin có thể quản lý bản dịch cho mọi POI/sạp được chọn.'}
            </p>
          </div>
          <Button onClick={startAdd} disabled={availableLanguages.length === 0}>
            Thêm bản dịch
          </Button>
        </div>
      </Card>

      <Card className="border-indigo-100 bg-indigo-50 p-4">
        <div className="flex flex-col gap-3 lg:flex-row lg:items-start lg:justify-between">
          <div>
            <h3 className="text-base font-semibold text-indigo-950">Tạo bản dịch tự động</h3>
            <p className="mt-1 text-sm text-indigo-800">
              {getTranslationProviderLabel(translationProviderStatus)}
            </p>
            {translationProviderStatus && !translationProviderStatus.isConfigured ? (
              <p className="mt-1 text-sm font-medium text-amber-700">Dịch vụ dịch chưa được cấu hình.</p>
            ) : null}
          </div>
          <Button onClick={onGenerate} isLoading={isGenerating} disabled={targetLanguages.length === 0}>
            Tạo {getGeneratedTranslationLabel(translationProviderStatus)}
          </Button>
        </div>

        <div className="mt-4 grid gap-4 lg:grid-cols-[220px_1fr]">
          <Select
            label="Ngôn ngữ nguồn"
            value={sourceLanguageCode}
            options={activeLanguages.map((language) => ({
              value: language.code,
              label: formatTranslationLanguage(language.code, languages),
            }))}
            onChange={(event) => {
              setSourceLanguageCode(event.target.value);
              setTargetLanguageCodes([]);
            }}
          />
          <div>
            <div className="mb-2 flex flex-wrap items-center justify-between gap-3">
              <span className="text-sm font-medium text-gray-700">Ngôn ngữ đích</span>
              <label className="flex items-center gap-2 text-sm text-gray-600">
                <input
                  type="checkbox"
                  checked={overwriteExisting}
                  onChange={(event) => {
                    setOverwriteExisting(event.target.checked);
                    setTargetLanguageCodes([]);
                  }}
                />
                Ghi đè bản dịch đã có
              </label>
            </div>
            <div className="flex max-h-40 flex-wrap gap-2 overflow-y-auto rounded-md border border-indigo-100 bg-white/70 p-2">
              {targetLanguages.length === 0 ? (
                <span className="text-sm text-gray-500">Không còn ngôn ngữ đích phù hợp.</span>
              ) : (
                targetLanguages.map((language) => (
                  <label
                    key={language.code}
                    className="flex cursor-pointer items-center gap-2 rounded-full border border-gray-200 bg-white px-3 py-1 text-sm"
                  >
                    <input
                      type="checkbox"
                      checked={targetLanguageCodes.includes(language.code)}
                      onChange={() => toggleTargetLanguage(language.code)}
                    />
                    {formatTranslationLanguage(language.code, languages)}
                  </label>
                ))
              )}
            </div>
          </div>
        </div>
      </Card>

      {form ? (
        <Card className="p-4">
          <div className="grid gap-4 lg:grid-cols-2">
            <Select
              label="Ngôn ngữ"
              value={form.languageCode}
              disabled={Boolean(form.id)}
              options={(form.id ? activeLanguages : availableLanguages).map((language) => ({
                value: language.code,
                label: formatTranslationLanguage(language.code, languages),
              }))}
              placeholder="-- Chọn ngôn ngữ --"
              onChange={(event) => setForm({ ...form, languageCode: event.target.value })}
            />
            <Input
              label="Tên bản dịch"
              value={form.name}
              onChange={(event) => setForm({ ...form, name: event.target.value })}
            />
            <div className="lg:col-span-2">
              <label htmlFor="translation-short" className="mb-1 block text-sm font-medium text-gray-700">
                Mô tả ngắn
              </label>
              <textarea
                id="translation-short"
                rows={3}
                value={form.shortDescription}
                onChange={(event) => setForm({ ...form, shortDescription: event.target.value })}
                className="w-full rounded-md border border-gray-300 px-3 py-2 text-sm shadow-sm focus:border-blue-500 focus:outline-none focus:ring-2 focus:ring-blue-500"
              />
            </div>
            <div className="lg:col-span-2">
              <label htmlFor="translation-description" className="mb-1 block text-sm font-medium text-gray-700">
                Mô tả
              </label>
              <textarea
                id="translation-description"
                rows={6}
                value={form.description}
                onChange={(event) => setForm({ ...form, description: event.target.value })}
                className="w-full rounded-md border border-gray-300 px-3 py-2 text-sm shadow-sm focus:border-blue-500 focus:outline-none focus:ring-2 focus:ring-blue-500"
              />
            </div>
          </div>
          <div className="mt-4 flex justify-end gap-2">
            <Button variant="secondary" onClick={() => setForm(null)}>
              Hủy
            </Button>
            <Button onClick={onSave} isLoading={isSaving}>
              Lưu bản dịch
            </Button>
          </div>
        </Card>
      ) : null}

      <Card className="p-0">
        <div className="overflow-x-auto">
          <table className="min-w-full divide-y divide-gray-100 text-sm">
            <thead className="bg-gray-50 text-left text-xs font-semibold uppercase text-gray-500">
              <tr>
                <th className="px-4 py-3">Ngôn ngữ</th>
                <th className="px-4 py-3">Tên</th>
                <th className="px-4 py-3">Mô tả ngắn</th>
                <th className="px-4 py-3 text-right">Thao tác</th>
              </tr>
            </thead>
            <tbody className="divide-y divide-gray-100">
              {isLoading ? <TableMessage colSpan={4} message="Đang tải bản dịch..." /> : null}
              {!isLoading && translations.length === 0 ? (
                <TableMessage colSpan={4} message="Chưa có bản dịch cho POI/sạp này." />
              ) : null}
              {translations.map((translation) => (
                <tr key={translation.id ?? translation.languageCode}>
                  <td className="px-4 py-3 font-medium text-gray-900">
                    {formatTranslationLanguage(translation.languageCode, languages)}
                  </td>
                  <td className="px-4 py-3 text-gray-700">{translation.name}</td>
                  <td className="max-w-[360px] px-4 py-3 text-gray-500">
                    <span className="line-clamp-2">{translation.shortDescription || '-'}</span>
                  </td>
                  <td className="px-4 py-3">
                    <div className="flex justify-end gap-2">
                      <Button size="sm" variant="secondary" onClick={() => startEdit(translation)}>
                        Sửa
                      </Button>
                      <Button
                        size="sm"
                        variant="danger"
                        onClick={() => onDelete(translation)}
                        isLoading={isDeleting}
                      >
                        Xóa
                      </Button>
                    </div>
                  </td>
                </tr>
              ))}
            </tbody>
          </table>
        </div>
      </Card>
    </div>
  );
}

function NarrationForm({
  form,
  poi,
  isVendor,
  isLoading,
  onChange,
  onSubmit,
}: {
  form: { title: string; languageCode: string; textContent: string; voice: string };
  poi: PoiDto;
  isVendor: boolean;
  isLoading: boolean;
  onChange: (form: { title: string; languageCode: string; textContent: string; voice: string }) => void;
  onSubmit: (event: FormEvent<HTMLFormElement>) => void;
}) {
  return (
    <form className="rounded-xl border border-gray-100 bg-white p-4 shadow-sm" onSubmit={onSubmit}>
      <div className="mb-4 rounded-lg bg-gray-50 px-4 py-3 text-sm">
        <p className="font-semibold text-gray-900">{poi.name || poi.displayName || poi.code}</p>
        <p className="mt-1 text-xs text-gray-500">
          {isVendor
            ? 'Bản thuyết minh sau khi gửi sẽ chờ admin duyệt.'
            : 'Admin duyệt nội dung do vendor gửi rồi tải MP3 sau khi dùng công cụ Text-to-Speech bên ngoài.'}
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
          <Button type="submit" isLoading={isLoading}>
            Gửi thuyết minh
          </Button>
        </div>
      </div>
    </form>
  );
}

function NarrationList({
  drafts,
  isLoading,
  canReview,
  busyId,
  onApprove,
  onReject,
  onView,
  onTranslate,
}: {
  drafts: NarrationDraftDto[];
  isLoading: boolean;
  canReview: boolean;
  busyId: number | null;
  onApprove: (draft: NarrationDraftDto) => void;
  onReject: (draft: NarrationDraftDto) => void;
  onView: (draft: NarrationDraftDto) => void;
  onTranslate: (draft: NarrationDraftDto) => void;
}) {
  return (
    <Card className="p-0">
      <div className="overflow-x-auto">
        <table className="min-w-full divide-y divide-gray-100 text-sm">
          <thead className="bg-gray-50 text-left text-xs font-semibold uppercase text-gray-500">
            <tr>
              <th className="px-4 py-3">Ngôn ngữ</th>
              <th className="px-4 py-3">Tiêu đề</th>
              <th className="px-4 py-3">Trạng thái</th>
              <th className="px-4 py-3">Người gửi</th>
              <th className="px-4 py-3">Cập nhật</th>
              <th className="px-4 py-3 text-right">Thao tác</th>
            </tr>
          </thead>
          <tbody className="divide-y divide-gray-100">
            {isLoading ? <TableMessage colSpan={6} message="Đang tải bản thuyết minh..." /> : null}
            {!isLoading && drafts.length === 0 ? (
              <TableMessage colSpan={6} message="Chưa có bản thuyết minh cho POI/sạp này." />
            ) : null}
            {drafts.map((draft) => (
              <tr key={draft.id}>
                <td className="px-4 py-3 font-medium text-gray-900">{formatLanguageLabel(draft.languageCode)}</td>
                <td className="max-w-[360px] px-4 py-3">
                  <p className="font-medium text-gray-900">{draft.title}</p>
                  <p className="line-clamp-2 text-xs text-gray-500">{draft.textContent}</p>
                  {draft.rejectionReason ? (
                    <p className="mt-1 text-xs text-red-600">Lý do từ chối: {draft.rejectionReason}</p>
                  ) : null}
                </td>
                <td className="px-4 py-3"><NarrationStatusPill status={draft.status} /></td>
                <td className="px-4 py-3 text-gray-600">{draft.submittedByUsername ?? draft.submittedByUserId}</td>
                <td className="px-4 py-3 text-gray-500">{formatDate(draft.updatedAt ?? draft.createdAt)}</td>
                <td className="px-4 py-3">
                  <div className="flex flex-wrap justify-end gap-2">
                    {canReview && (draft.status === 'Approved' || draft.status === 'AudioGenerated') ? (
                      <Button variant="secondary" size="sm" onClick={() => onTranslate(draft)}>
                        Dịch thuyết minh
                      </Button>
                    ) : null}
                    <Button variant="ghost" size="sm" onClick={() => onView(draft)}>
                      Xem nội dung
                    </Button>
                    {canReview && draft.status === 'Pending' ? (
                      <Button
                        variant="secondary"
                        size="sm"
                        isLoading={busyId === draft.id}
                        onClick={() => onApprove(draft)}
                      >
                        Duyệt
                      </Button>
                    ) : null}
                    {canReview && draft.status === 'Pending' ? (
                      <Button
                        variant="danger"
                        size="sm"
                        isLoading={busyId === draft.id}
                        onClick={() => onReject(draft)}
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
    </Card>
  );
}

function ImageStatusGroup({
  title,
  mediaItems,
  tone,
  canReview,
  busyId,
  onPreview,
  onApprove,
  onReject,
}: {
  title: string;
  mediaItems: MediaFileDto[];
  tone: 'amber' | 'green' | 'red';
  canReview: boolean;
  busyId: number | null;
  onPreview: (media: MediaFileDto) => void;
  onApprove: (media: MediaFileDto) => void;
  onReject: (media: MediaFileDto) => void;
}) {
  return (
    <Card className="p-4">
      <div className="mb-3 flex items-center justify-between">
        <h3 className="text-sm font-semibold text-gray-900">{title}</h3>
        <StatusPill tone={tone}>{mediaItems.length}</StatusPill>
      </div>
      <div className="grid gap-3">
        {mediaItems.length === 0 ? (
          <p className="rounded-lg border border-dashed border-gray-200 px-3 py-6 text-center text-sm text-gray-500">
            Không có ảnh.
          </p>
        ) : (
          mediaItems.map((media) => (
            <div key={media.id} className="overflow-hidden rounded-lg border border-gray-100">
              <button type="button" className="block h-40 w-full bg-gray-50" onClick={() => onPreview(media)}>
                <SecureImage
                  src={getMediaUrl(media)}
                  alt={media.originalFileName}
                  className="h-full w-full object-cover"
                />
              </button>
              <div className="space-y-2 p-3">
                <p className="truncate text-sm font-medium text-gray-900">{media.originalFileName}</p>
                <p className="text-xs text-gray-500">{formatDate(media.uploadedAt)}</p>
                {media.rejectionReason ? (
                  <p className="text-xs text-red-600">Lý do: {media.rejectionReason}</p>
                ) : null}
                {canReview ? (
                  <div className="flex flex-wrap gap-2">
                    {media.approvalStatus !== 'Approved' ? (
                      <Button size="sm" variant="secondary" isLoading={busyId === media.id} onClick={() => onApprove(media)}>
                        Duyệt
                      </Button>
                    ) : null}
                    {media.approvalStatus !== 'Rejected' ? (
                      <Button size="sm" variant="danger" isLoading={busyId === media.id} onClick={() => onReject(media)}>
                        Từ chối
                      </Button>
                    ) : null}
                  </div>
                ) : null}
              </div>
            </div>
          ))
        )}
      </div>
    </Card>
  );
}

function TabButton({
  active,
  onClick,
  children,
}: {
  active: boolean;
  onClick: () => void;
  children: ReactNode;
}) {
  return (
    <button
      type="button"
      onClick={onClick}
      className={`border-b-2 px-3 py-2 text-sm font-medium transition-colors ${
        active
          ? 'border-blue-600 text-blue-700'
          : 'border-transparent text-gray-500 hover:border-gray-300 hover:text-gray-900'
      }`}
    >
      {children}
    </button>
  );
}

function StatusPill({
  tone,
  children,
}: {
  tone: 'blue' | 'amber' | 'green' | 'red' | 'gray';
  children: ReactNode;
}) {
  const classes = {
    blue: 'bg-blue-50 text-blue-700',
    amber: 'bg-amber-50 text-amber-700',
    green: 'bg-green-50 text-green-700',
    red: 'bg-red-50 text-red-700',
    gray: 'bg-gray-100 text-gray-700',
  };

  return <span className={`inline-flex rounded-full px-2.5 py-1 text-xs font-semibold ${classes[tone]}`}>{children}</span>;
}

function MetricCard({ label, value }: { label: string; value: number }) {
  return (
    <div className="rounded-lg border border-gray-100 bg-gray-50 p-3">
      <p className="text-xs font-medium uppercase tracking-wide text-gray-500">{label}</p>
      <p className="mt-1 text-2xl font-bold text-gray-900">{value}</p>
    </div>
  );
}

function SummaryLine({
  label,
  value,
  actionLabel,
  onAction,
}: {
  label: string;
  value: string;
  actionLabel: string;
  onAction: () => void;
}) {
  return (
    <div className="rounded-lg border border-gray-100 p-4">
      <p className="text-sm font-semibold text-gray-900">{label}</p>
      <p className="mt-1 text-sm text-gray-600">{value}</p>
      <Button className="mt-3" size="sm" variant="secondary" onClick={onAction}>
        {actionLabel}
      </Button>
    </div>
  );
}

function InfoRow({ label, value }: { label: string; value: string }) {
  return (
    <div className="flex items-start justify-between gap-3 rounded-lg border border-gray-100 px-3 py-2">
      <span className="text-gray-500">{label}</span>
      <span className="text-right font-medium text-gray-900">{value}</span>
    </div>
  );
}

function LoadingCard({ message }: { message: string }) {
  return <Card className="p-6 text-sm text-gray-500">{message}</Card>;
}

function EmptyCard({ message }: { message: string }) {
  return (
    <Card className="p-6 text-center text-sm text-gray-500">
      {message}
    </Card>
  );
}

function TableMessage({ colSpan, message }: { colSpan: number; message: string }) {
  return (
    <tr>
      <td colSpan={colSpan} className="px-4 py-6 text-center text-gray-500">
        {message}
      </td>
    </tr>
  );
}

function MediaPreviewModal({ media, onClose }: { media: MediaFileDto | null; onClose: () => void }) {
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

function RejectModal({
  open,
  title,
  reason,
  isLoading,
  onReasonChange,
  onClose,
  onSubmit,
}: {
  open: boolean;
  title: string;
  reason: string;
  isLoading: boolean;
  onReasonChange: (reason: string) => void;
  onClose: () => void;
  onSubmit: () => void;
}) {
  return (
    <Modal open={open} onClose={onClose} title={title}>
      <div className="space-y-4">
        <textarea
          rows={4}
          value={reason}
          onChange={(event) => onReasonChange(event.target.value)}
          placeholder="Nhập lý do để người gửi hiểu cần chỉnh gì."
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

function TranslateNarrationModal({
  draft,
  narrations,
  languages,
  targetLanguageCodes,
  overwriteExisting,
  isLoading,
  onTargetLanguageCodesChange,
  onOverwriteExistingChange,
  onClose,
  onSubmit,
}: {
  draft: NarrationDraftDto | null;
  narrations: NarrationDraftDto[];
  languages: LanguageDto[];
  targetLanguageCodes: string[];
  overwriteExisting: boolean;
  isLoading: boolean;
  onTargetLanguageCodesChange: (codes: string[]) => void;
  onOverwriteExistingChange: (value: boolean) => void;
  onClose: () => void;
  onSubmit: () => void;
}) {
  const existingByLanguage = new Map(narrations.map((item) => [item.languageCode, item]));
  const targets = languages.filter((language) => language.code !== draft?.languageCode);

  const toggleLanguage = (code: string) => {
    onTargetLanguageCodesChange(
      targetLanguageCodes.includes(code)
        ? targetLanguageCodes.filter((item) => item !== code)
        : [...targetLanguageCodes, code],
    );
  };

  const changeOverwrite = (value: boolean) => {
    onOverwriteExistingChange(value);
    onTargetLanguageCodesChange(
      targetLanguageCodes.filter((code) => {
        const existing = existingByLanguage.get(code);
        return !existing || (value && !existing.generatedAudioTrackId && existing.status !== 'AudioGenerated');
      }),
    );
  };

  return (
    <Modal open={Boolean(draft)} onClose={onClose} title="Dịch bản thuyết minh" scrollable>
      {draft ? (
        <div className="space-y-4">
          <div className="rounded-md border border-gray-200 bg-gray-50 px-4 py-3 text-sm">
            <p className="font-semibold text-gray-900">{draft.title}</p>
            <p className="mt-1 text-gray-600">Ngôn ngữ nguồn: {formatLanguageLabel(draft.languageCode)}</p>
          </div>

          <div>
            <div className="mb-2 flex items-center justify-between gap-3">
              <span className="text-sm font-medium text-gray-700">Ngôn ngữ đích</span>
              <label className="flex items-center gap-2 text-sm text-gray-600">
                <input
                  type="checkbox"
                  checked={overwriteExisting}
                  onChange={(event) => changeOverwrite(event.target.checked)}
                />
                Ghi đè bản chưa có MP3
              </label>
            </div>
            <div className="grid gap-2 sm:grid-cols-2">
              {targets.map((language) => {
                const existing = existingByLanguage.get(language.code);
                const hasAudio = Boolean(existing?.generatedAudioTrackId) || existing?.status === 'AudioGenerated';
                const disabled = hasAudio || (Boolean(existing) && !overwriteExisting);
                return (
                  <label
                    key={language.code}
                    className={`flex items-center justify-between gap-3 rounded-md border px-3 py-2 text-sm ${
                      disabled ? 'cursor-not-allowed bg-gray-50 text-gray-400' : 'cursor-pointer bg-white text-gray-800'
                    }`}
                  >
                    <span>{formatTranslationLanguage(language.code, languages)}</span>
                    <span className="flex items-center gap-2">
                      {hasAudio ? <span className="text-xs">Đã có MP3</span> : existing ? <span className="text-xs">Đã có</span> : null}
                      <input
                        type="checkbox"
                        disabled={disabled}
                        checked={targetLanguageCodes.includes(language.code)}
                        onChange={() => toggleLanguage(language.code)}
                      />
                    </span>
                  </label>
                );
              })}
            </div>
          </div>

          <p className="text-sm text-gray-600">
            Tiêu đề và nội dung sẽ được dịch. Mỗi ngôn ngữ tạo thành một bản thuyết minh đã duyệt để admin tải MP3 tại tab Âm thanh.
          </p>
          <div className="flex justify-end gap-2">
            <Button variant="secondary" onClick={onClose}>Hủy</Button>
            <Button disabled={targetLanguageCodes.length === 0} isLoading={isLoading} onClick={onSubmit}>
              Dịch thuyết minh
            </Button>
          </div>
        </div>
      ) : null}
    </Modal>
  );
}

function NarrationTextModal({ draft, onClose }: { draft: NarrationDraftDto | null; onClose: () => void }) {
  const [copied, setCopied] = useState(false);

  const handleCopy = async () => {
    if (!draft) return;
    await navigator.clipboard.writeText(draft.textContent);
    setCopied(true);
    window.setTimeout(() => setCopied(false), 1600);
  };

  return (
    <Modal open={Boolean(draft)} onClose={onClose} title="Nội dung thuyết minh cho TTS">
      {draft ? (
        <div className="space-y-4">
          <div className="rounded-lg bg-gray-50 px-4 py-3 text-sm">
            <p className="font-semibold text-gray-900">{draft.title}</p>
            <p className="text-xs text-gray-500">
              {draft.poiName ?? `POI ${draft.poiId}`} · {formatLanguageLabel(draft.languageCode)}
            </p>
            <p className="mt-2 text-xs text-gray-600">
              Sao chép nội dung này sang công cụ Text-to-Speech bên ngoài, sau đó tải MP3 ở tab Âm thanh.
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
            <Button onClick={handleCopy}>{copied ? 'Đã sao chép' : 'Sao chép cho TTS'}</Button>
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
              {draft.poiName ?? `POI ${draft.poiId}`} · {formatLanguageLabel(draft.languageCode)}
            </p>
            <p className="mt-2 text-xs text-gray-600">
              Tải MP3 đã tạo từ công cụ Text-to-Speech bên ngoài cho đúng POI và ngôn ngữ này.
            </p>
          </div>
          {error ? <Alert variant="error" message={error} /> : null}
          <Input
            id="audio-title"
            label="Tiêu đề audio"
            placeholder={draft.title}
            value={title}
            onChange={(event) => setTitle(event.target.value)}
          />
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
          <p className="rounded-md border border-blue-100 bg-blue-50 px-3 py-2 text-sm text-blue-800">
            Sau khi tải lên, audio sẽ được preview qua endpoint CMS bảo vệ và public chỉ phát qua endpoint audio bảo vệ.
          </p>
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

interface ContentSummary {
  images: { total: number; pending: number; approved: number; rejected: number };
  narrations: { total: number; pending: number; approved: number; rejected: number; audioGenerated: number };
  audio: { generated: number; missing: number };
  translations: { total: number };
}

function buildContentSummary(
  images: MediaFileDto[],
  narrations: NarrationDraftDto[],
  translations: Translation[],
): ContentSummary {
  const approvedNarrations = narrations.filter((draft) => draft.status === 'Approved' || draft.status === 'AudioGenerated');
  const audioGenerated = narrations.filter((draft) => Boolean(draft.generatedAudioTrackId) || draft.status === 'AudioGenerated').length;

  return {
    images: {
      total: images.length,
      pending: images.filter((media) => media.approvalStatus === 'Pending').length,
      approved: images.filter((media) => media.approvalStatus === 'Approved').length,
      rejected: images.filter((media) => media.approvalStatus === 'Rejected').length,
    },
    narrations: {
      total: narrations.length,
      pending: narrations.filter((draft) => draft.status === 'Pending').length,
      approved: narrations.filter((draft) => draft.status === 'Approved' || draft.status === 'AudioGenerated').length,
      rejected: narrations.filter((draft) => draft.status === 'Rejected').length,
      audioGenerated,
    },
    audio: {
      generated: audioGenerated,
      missing: Math.max(approvedNarrations.length - audioGenerated, 0),
    },
    translations: {
      total: translations.length,
    },
  };
}

function groupMediaByStatus(images: MediaFileDto[]): Record<ApprovalStatus, MediaFileDto[]> {
  return {
    Pending: images.filter((media) => media.approvalStatus === 'Pending'),
    Approved: images.filter((media) => media.approvalStatus === 'Approved'),
    Rejected: images.filter((media) => media.approvalStatus === 'Rejected'),
  };
}

function buildLanguageRows(narrations: NarrationDraftDto[], translations: Translation[]) {
  const codes = new Set<string>();
  narrations.forEach((draft) => codes.add(draft.languageCode));
  translations.forEach((translation) => codes.add(translation.languageCode));

  return Array.from(codes).sort().map((languageCode) => {
    const draft = narrations.find((item) => item.languageCode === languageCode);
    const translation = translations.find((item) => item.languageCode === languageCode);
    return {
      languageCode,
      narrationStatus: draft?.status,
      hasAudio: Boolean(draft?.generatedAudioTrackId) || draft?.status === 'AudioGenerated',
      hasTranslation: Boolean(translation),
    };
  });
}

function getRecommendedAction(summary: ContentSummary, isVendor: boolean): string {
  if (summary.images.approved === 0 && summary.images.pending === 0) {
    return isVendor ? 'Cần thêm ảnh đầu tiên để admin duyệt.' : 'Chưa có ảnh, hãy nhắc vendor bổ sung hình ảnh.';
  }
  if (summary.narrations.total === 0) {
    return isVendor ? 'Cần tạo bản thuyết minh cho ít nhất một ngôn ngữ.' : 'Chưa có bản thuyết minh để duyệt.';
  }
  if (summary.narrations.pending > 0) {
    return isVendor ? 'Bản thuyết minh đang chờ admin duyệt.' : 'Có bản thuyết minh đang chờ duyệt.';
  }
  if (summary.audio.missing > 0) {
    return isVendor ? 'Đang chờ admin tải MP3 cho bản thuyết minh đã duyệt.' : 'Cần tải MP3 cho bản thuyết minh đã duyệt.';
  }
  if (summary.translations.total === 0) {
    return 'Cần bổ sung bản dịch để phục vụ khách dùng ngôn ngữ khác.';
  }
  return 'Nội dung chính đã tương đối đầy đủ. Tiếp tục kiểm tra chất lượng ảnh, audio và bản dịch.';
}

function getLifecycleLabel(status: unknown): string {
  if (status === 'Approved' || Number(status) === 1) return 'Đã duyệt';
  if (status === 'PendingPayment' || Number(status) === 2) return 'Chờ thanh toán';
  if (status === 'Active' || Number(status) === 3) return 'Đang hoạt động';
  if (status === 'Expired' || Number(status) === 4) return 'Hết hạn';
  if (status === 'Rejected' || Number(status) === 5) return 'Bị từ chối';
  return 'Chờ duyệt';
}

function getPaymentLabel(status: unknown): string {
  if (status === 'PendingPayment' || Number(status) === 1) return 'Chờ thanh toán';
  if (status === 'Paid' || Number(status) === 2) return 'Đã thanh toán';
  if (status === 'Waived' || Number(status) === 3) return 'Miễn thanh toán';
  return 'Không yêu cầu';
}

function getPublicVisibilityStatus(poi: PoiDto): { isPublic: boolean; label: string; reason: string } {
  const deletedAt = (poi as PoiDto & { deletedAt?: string | null }).deletedAt;
  const now = Date.now();
  const lifecycleActive = poi.lifecycleStatus === 'Active' || Number(poi.lifecycleStatus) === 3;
  const validFromOk = !poi.validFrom || new Date(poi.validFrom).getTime() <= now;
  const validUntilOk = !poi.validUntil || new Date(poi.validUntil).getTime() >= now;
  const isPublic = !deletedAt && lifecycleActive && poi.isActive && validFromOk && validUntilOk;

  if (isPublic) return { isPublic: true, label: 'Đang công khai', reason: 'Đủ điều kiện hiển thị công khai.' };
  if (deletedAt) return { isPublic: false, label: 'Đã xóa', reason: 'Sạp/địa điểm đã bị xóa mềm.' };
  if (!lifecycleActive) return { isPublic: false, label: 'Chưa công khai', reason: `Trạng thái hiện tại: ${getLifecycleLabel(poi.lifecycleStatus)}.` };
  if (!poi.isActive) return { isPublic: false, label: 'Tạm tắt', reason: 'Sạp/địa điểm đang tạm tắt.' };
  if (!validFromOk) return { isPublic: false, label: 'Chưa đến hiệu lực', reason: 'Chưa đến thời gian hiển thị.' };
  if (!validUntilOk) return { isPublic: false, label: 'Hết hiệu lực', reason: 'Đã quá thời gian hiển thị.' };
  return { isPublic: false, label: 'Chưa công khai', reason: 'Chưa đủ điều kiện hiển thị.' };
}

function NarrationStatusPill({ status }: { status?: NarrationStatus }) {
  if (!status) {
    return <StatusPill tone="gray">Chưa có</StatusPill>;
  }

  const tone = status === 'Approved' || status === 'AudioGenerated'
    ? 'green'
    : status === 'Rejected'
      ? 'red'
      : 'amber';

  return <StatusPill tone={tone}>{statusLabel(status)}</StatusPill>;
}

function statusLabel(status: string): string {
  switch (status) {
    case 'Pending':
      return 'Chờ duyệt';
    case 'Approved':
      return 'Đã duyệt';
    case 'Rejected':
      return 'Bị từ chối';
    case 'AudioGenerated':
      return 'Đã có âm thanh';
    default:
      return status;
  }
}

function normalizeWorkspaceTab(value: string | null): WorkspaceTab {
  if (value === 'images' || value === 'narrations' || value === 'audio' || value === 'translations') {
    return value;
  }
  return 'overview';
}

function getFirstError(errors: unknown[]): string | null {
  const error = errors.find(Boolean);
  if (!error) return null;
  const message = extractApiError(error);
  if (/Request failed with status code/i.test(message)) {
    return 'Thao tác thất bại. Vui lòng kiểm tra dữ liệu và thử lại.';
  }
  if (/POI is required/i.test(message)) {
    return 'Vui lòng chọn POI/sạp trước khi thao tác.';
  }
  return message;
}

function getTranslationProviderLabel(providerStatus?: TranslationProviderStatus | null): string {
  return providerStatus?.isSimulated === false
    ? 'Dịch tự động'
    : 'Dịch mô phỏng / chưa kết nối dịch vụ dịch thật.';
}

function getGeneratedTranslationLabel(providerStatus?: TranslationProviderStatus | null): string {
  return providerStatus?.isSimulated === false ? 'bản dịch tự động' : 'bản dịch mô phỏng';
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

function formatTranslationLanguage(code: string, languages: LanguageDto[]): string {
  const language = languages.find((item) => item.code === code);
  return language ? `${language.name} (${language.nativeName})` : formatLanguageLabel(code);
}

function formatDate(value?: string | null): string {
  if (!value) return '-';
  const date = new Date(value);
  if (Number.isNaN(date.getTime())) return '-';

  return new Intl.DateTimeFormat('vi-VN', {
    year: 'numeric',
    month: 'short',
    day: '2-digit',
    hour: '2-digit',
    minute: '2-digit',
  }).format(date);
}

function formatAudioDuration(durationSeconds?: number | null): string {
  if (!durationSeconds || durationSeconds <= 0) {
    return 'Chưa rõ';
  }

  const minutes = Math.floor(durationSeconds / 60);
  const seconds = durationSeconds % 60;
  return `${minutes}:${seconds.toString().padStart(2, '0')}`;
}

export default MediaLibraryPage;
