import { useEffect, useState } from 'react';
import { useQuery, useMutation, useQueryClient } from '@tanstack/react-query';
import { poiTranslationsApi } from '../api/poiTranslationsApi';
import { poisApi } from '../api/poisApi';
import { languagesApi } from '../../languages/api/languagesApi';
import { useToast } from '../../../components/ui/Toast';

interface Props {
    isOpen: boolean;
    onClose: () => void;
    poi: any;
    readOnly?: boolean;
}

type Translation = {
    id: any;
    languageCode: string;
    name: string;
    shortDescription: string;
    description: string;
};

export default function PoiTranslationModal({ isOpen, onClose, poi, readOnly = false }: Props) {
    const [viewMode, setViewMode] = useState<'list' | 'form'>('list');
    const [editing, setEditing] = useState<Translation | null>(null);
    const [isTranslating, setIsTranslating] = useState(false);
    const qc = useQueryClient();
    const toast = useToast();

    const { data, isLoading, isError } = useQuery({
        queryKey: ['poiTranslations', poi?.id],
        queryFn: () => poiTranslationsApi.getByPoiId(poi.id),
        enabled: isOpen && !!poi?.id,
    });

    const { data: languages } = useQuery({
        queryKey: ['languages'],
        queryFn: languagesApi.getAll,
        enabled: isOpen,
    });

    const createMutation = useMutation({
        mutationFn: (payload: any) => poiTranslationsApi.create(poi.id, payload),
        onSuccess: () => {
            qc.invalidateQueries({ queryKey: ['poiTranslations', poi.id] });
            toast('Đã thêm bản dịch', 'success');
        },
    });

    const updateMutation = useMutation({
        mutationFn: ({ translationId, payload }: any) => poiTranslationsApi.update(poi.id, translationId, payload),
        onSuccess: () => {
            qc.invalidateQueries({ queryKey: ['poiTranslations', poi.id] });
            toast('Đã cập nhật bản dịch', 'success');
        },
    });

    const deleteMutation = useMutation({
        mutationFn: (translationId: any) => poiTranslationsApi.delete(poi.id, translationId),
        onSuccess: () => {
            qc.invalidateQueries({ queryKey: ['poiTranslations', poi.id] });
            toast('Đã xoá bản dịch', 'success');
        },
    });

    useEffect(() => {
        if (isOpen) {
            setViewMode(readOnly ? 'form' : 'list');
            setEditing(null);
        }
    }, [isOpen, poi, readOnly]);

    useEffect(() => {
        if (!readOnly || !isOpen) {
            return;
        }

        const firstTranslation = (data ?? [])[0];
        setEditing(firstTranslation ? toTranslation(firstTranslation) : null);
    }, [data, isOpen, readOnly]);

    if (!isOpen) return null;

    const openAddForm = () => {
        if (readOnly) return;
        setEditing({ id: undefined, languageCode: 'vi', name: '', shortDescription: '', description: '' });
        setViewMode('form');
    };

    const handleEdit = (t: Translation) => {
        if (readOnly) return;
        setEditing(t);
        setViewMode('form');
    };

    const handleDelete = async (id: any) => {
        if (!window.confirm('Bạn có chắc chắn muốn xoá bản dịch này?')) return;
        try {
            await deleteMutation.mutateAsync(id);
        } catch (err: any) {
            toast(err?.message || 'Lỗi khi xoá', 'error');
        }
    };

    const handleSave = async () => {
        if (!editing) return;
        const payload = {
            languageCode: editing.languageCode,
            name: editing.name,
            shortDescription: editing.shortDescription,
            description: editing.description,
        };

        try {
            if (editing.id) {
                await updateMutation.mutateAsync({ translationId: editing.id, payload });
            } else {
                await createMutation.mutateAsync(payload);
            }
            setViewMode('list');
            setEditing(null);
        } catch (err: any) {
            toast(err?.message || 'Lỗi khi lưu', 'error');
        }
    };

    const handleAutoTranslate = async () => {
        if (readOnly || !editing || isTranslating) return;

        const sourceValues = getOriginalPoiTextValues(poi);
        const translatableFields = POI_TRANSLATION_FIELDS.filter((field) => sourceValues[field].trim());
        if (translatableFields.length === 0) {
            toast('Không có nội dung Tiếng Việt để dịch', 'error');
            return;
        }

        if (!editing.languageCode) {
            toast('Vui lòng chọn ngôn ngữ đích', 'error');
            return;
        }

        try {
            setIsTranslating(true);
            const translatedEntries = await Promise.all(
                translatableFields.map(async (field) => [
                    field,
                    await poisApi.translateText(sourceValues[field], editing.languageCode),
                ] as const),
            );

            setEditing((current) => current ? { ...current, ...Object.fromEntries(translatedEntries) } : current);
            toast('Đã dịch tự động bằng Google', 'success');
        } catch (err: any) {
            toast(err?.message || 'Google Translate không thể dịch lúc này', 'error');
        } finally {
            setIsTranslating(false);
        }
    };

    return (
        <div className="fixed inset-0 z-50 flex items-center justify-center bg-black/40 p-4">
            <div className="w-full max-w-4xl bg-white rounded-lg shadow-lg overflow-hidden">
                <div className="px-6 py-4 border-b flex items-center justify-between">
                    {viewMode === 'list' ? (
                        <h3 className="text-lg font-medium">
                            {readOnly ? `Xem bản dịch - POI: ${poi?.code}` : `Quản lý dịch thuật - POI: ${poi?.code}`}
                        </h3>
                    ) : (
                        <h3 className="text-lg font-medium">
                            {readOnly ? `Xem bản dịch - POI: ${poi?.code}` : 'Thêm/Sửa bản dịch'}
                        </h3>
                    )}

                    <div className="flex items-center gap-2">
                        {viewMode === 'list' && !readOnly && (
                            <button
                                type="button"
                                className="px-3 py-1 bg-blue-600 text-white text-sm rounded hover:bg-blue-700 transition-colors"
                                onClick={openAddForm}
                            >
                                + Thêm bản dịch mới
                            </button>
                        )}
                        <button
                            type="button"
                            className="text-gray-500 hover:text-gray-700"
                            onClick={() => {
                                setViewMode('list');
                                setEditing(null);
                                onClose();
                            }}
                            aria-label="Đóng"
                        >
                            ✕
                        </button>
                    </div>
                </div>

                <div className="p-6">
                    {viewMode === 'list' ? (
                        <div>
                            <div className="overflow-x-auto">
                                <table className="w-full text-sm text-left border-collapse">
                                    <thead className="text-gray-500 text-xs uppercase bg-gray-50 border-b">
                                        <tr>
                                            <th className="px-4 py-3 font-semibold w-[15%]">Ngôn ngữ</th>
                                            <th className="px-4 py-3 font-semibold w-[30%]">Tên địa điểm</th>
                                            <th className="px-4 py-3 font-semibold w-[35%]">Mô tả ngắn</th>
                                            {!readOnly ? (
                                                <th className="px-4 py-3 font-semibold w-[20%] text-right">Hành động</th>
                                            ) : null}
                                        </tr>
                                    </thead>
                                    <tbody className="divide-y divide-gray-100">
                                        {isLoading ? (
                                            <tr>
                                                <td colSpan={readOnly ? 3 : 4} className="px-4 py-6 text-center text-gray-500">Đang tải...</td>
                                            </tr>
                                        ) : isError ? (
                                            <tr>
                                                <td colSpan={readOnly ? 3 : 4} className="px-4 py-6 text-center text-red-500">Lỗi khi tải dữ liệu</td>
                                            </tr>
                                        ) : (data?.length === 0) ? (
                                            <tr>
                                                <td colSpan={readOnly ? 3 : 4} className="px-4 py-6 text-center text-gray-500">Chưa có bản dịch nào</td>
                                            </tr>
                                        ) : (
                                            (data ?? []).map((t: any) => (
                                                <tr key={t.id} className="hover:bg-gray-50 transition-colors">
                                                    <td className="px-4 py-3 font-medium text-gray-900">{t.languageCode}</td>
                                                    <td className="px-4 py-3 text-gray-700">{t.name}</td>
                                                    <td className="px-4 py-3 text-gray-500 truncate max-w-[200px]">{t.shortDescription}</td>
                                                    {!readOnly ? (
                                                    <td className="px-4 py-3 text-right">
                                                        <div className="flex justify-end gap-2">
                                                            <button
                                                                type="button"
                                                                className="px-3 py-1 text-sm bg-yellow-500 hover:bg-yellow-600 transition-colors text-white rounded font-medium"
                                                                onClick={() => handleEdit(t)}
                                                            >
                                                                Sửa
                                                            </button>
                                                            <button
                                                                type="button"
                                                                className="px-3 py-1 text-sm bg-red-500 hover:bg-red-600 transition-colors text-white rounded font-medium"
                                                                onClick={() => handleDelete(t.id)}
                                                            >
                                                                Xóa
                                                            </button>
                                                        </div>
                                                    </td>
                                                    ) : null}
                                                </tr>
                                            ))
                                        )}
                                    </tbody>
                                </table>
                            </div>
                        </div>
                    ) : (
                        <div>
                            {readOnly && isLoading ? (
                                <div className="py-8 text-center text-sm text-gray-500">Đang tải bản dịch...</div>
                            ) : readOnly && isError ? (
                                <div className="py-8 text-center text-sm text-red-500">Không thể tải bản dịch</div>
                            ) : readOnly && (data ?? []).length === 0 ? (
                                <div className="py-8 text-center text-sm text-gray-500">POI này chưa có bản dịch nào</div>
                            ) : (
                            <div className="grid grid-cols-1 gap-4">
                                <div>
                                    <div className="flex items-center justify-between gap-3">
                                        <label className="block text-sm font-medium text-gray-700">Ngôn ngữ</label>
                                        {!readOnly ? (
                                        <button
                                            type="button"
                                            className="inline-flex items-center justify-center rounded bg-indigo-50 px-3 py-1 text-xs font-medium text-indigo-700 transition-colors hover:bg-indigo-100 disabled:cursor-not-allowed disabled:opacity-60"
                                            disabled={isTranslating}
                                            onClick={() => void handleAutoTranslate()}
                                        >
                                            {isTranslating ? 'Đang dịch...' : '🤖 Dịch tự động (Google)'}
                                        </button>
                                        ) : null}
                                    </div>
                                    <select
                                        value={editing?.languageCode}
                                        onChange={(e) => {
                                            if (readOnly) {
                                                const selected = (data ?? []).find((translation: any) => translation.languageCode === e.target.value);
                                                setEditing(selected ? toTranslation(selected) : null);
                                                return;
                                            }

                                            setEditing((s) => (s ? { ...s, languageCode: e.target.value } : s));
                                        }}
                                        className="mt-1 block w-full border rounded px-3 py-2 text-sm"
                                    >
                                        <option value="" disabled>-- Chọn ngôn ngữ --</option>
                                        {readOnly
                                            ? (data ?? []).map((translation: any) => (
                                                <option key={translation.id} value={translation.languageCode}>
                                                    {getLanguageLabel(translation.languageCode, languages)}
                                                </option>
                                            ))
                                            : (languages ?? []).map((language: any) => (
                                                <option key={language.code} value={language.code}>
                                                    {language.name} ({language.nativeName})
                                                </option>
                                            ))}
                                    </select>
                                </div>

                                <div>
                                    <label className="block text-sm font-medium text-gray-700">Tên địa điểm</label>
                                    <input
                                        type="text"
                                        value={editing?.name ?? ''}
                                        readOnly={readOnly}
                                        onChange={(e) => !readOnly && setEditing((s) => (s ? { ...s, name: e.target.value } : s))}
                                        className={`mt-1 block w-full border rounded px-3 py-2 text-sm ${readOnly ? 'bg-gray-100 text-gray-600 cursor-not-allowed' : ''}`}
                                    />
                                </div>

                                <div>
                                    <label className="block text-sm font-medium text-gray-700">Mô tả ngắn</label>
                                    <textarea
                                        rows={3}
                                        value={editing?.shortDescription ?? ''}
                                        readOnly={readOnly}
                                        onChange={(e) => !readOnly && setEditing((s) => (s ? { ...s, shortDescription: e.target.value } : s))}
                                        className={`mt-1 block w-full border rounded px-3 py-2 text-sm ${readOnly ? 'bg-gray-100 text-gray-600 cursor-not-allowed' : ''}`}
                                    />
                                </div>

                                <div>
                                    <label className="block text-sm font-medium text-gray-700">Mô tả chi tiết</label>
                                    <textarea
                                        rows={6}
                                        value={editing?.description ?? ''}
                                        readOnly={readOnly}
                                        onChange={(e) => !readOnly && setEditing((s) => (s ? { ...s, description: e.target.value } : s))}
                                        className={`mt-1 block w-full border rounded px-3 py-2 text-sm ${readOnly ? 'bg-gray-100 text-gray-600 cursor-not-allowed' : ''}`}
                                    />
                                </div>

                                <div className="flex justify-end gap-2 mt-4">
                                    <button
                                        type="button"
                                        className="px-4 py-2 bg-gray-200 hover:bg-gray-300 transition-colors rounded text-sm font-medium text-gray-700"
                                        onClick={() => {
                                            if (readOnly) {
                                                onClose();
                                            } else {
                                                setViewMode('list');
                                                setEditing(null);
                                            }
                                        }}
                                    >
                                        {readOnly ? 'Đóng' : 'Hủy'}
                                    </button>
                                    {!readOnly ? (
                                    <button
                                        type="button"
                                        className="px-4 py-2 bg-blue-600 hover:bg-blue-700 transition-colors text-white rounded text-sm font-medium"
                                        onClick={handleSave}
                                    >
                                        Lưu
                                    </button>
                                    ) : null}
                                </div>
                            </div>
                            )}
                        </div>
                    )}
                </div>
            </div>
        </div>
    );
}

function toTranslation(value: any): Translation {
    return {
        id: value.id,
        languageCode: value.languageCode,
        name: value.name ?? '',
        shortDescription: value.shortDescription ?? '',
        description: value.description ?? '',
    };
}

function getLanguageLabel(languageCode: string, languages: any[] | undefined): string {
    const language = (languages ?? []).find((item: any) => item.code === languageCode);
    return language ? `${language.name} (${language.nativeName})` : languageCode;
}

const POI_TRANSLATION_FIELDS = ['name', 'shortDescription', 'description'] as const;

function getOriginalPoiTextValues(poi: any): Pick<Translation, 'name' | 'shortDescription' | 'description'> {
    return {
        name: getOriginalPoiText(poi, 'name'),
        shortDescription: getOriginalPoiText(poi, 'shortDescription'),
        description: getOriginalPoiText(poi, 'description'),
    };
}

function getOriginalPoiText(poi: any, field: (typeof POI_TRANSLATION_FIELDS)[number]): string {
    const value = poi?.[field];
    return typeof value === 'string' ? value : '';
}
