import React, { useEffect, useState } from 'react';
import { useQuery, useMutation, useQueryClient } from '@tanstack/react-query';
import { poiTranslationsApi } from '../api/poiTranslationsApi';
import { languagesApi } from '../../languages/api/languagesApi';
import { useToast } from '../../../components/ui/Toast';

interface Props {
    isOpen: boolean;
    onClose: () => void;
    poi: any;
}

type Translation = {
    id: any;
    languageCode: string;
    name: string;
    shortDescription: string;
    description: string;
};

export default function PoiTranslationModal({ isOpen, onClose, poi }: Props) {
    const [viewMode, setViewMode] = useState<'list' | 'form'>('list');
    const [editing, setEditing] = useState<Translation | null>(null);
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
            setViewMode('list');
            setEditing(null);
        }
    }, [isOpen, poi]);

    if (!isOpen) return null;

    const openAddForm = () => {
        setEditing({ id: undefined, languageCode: 'vi', name: '', shortDescription: '', description: '' });
        setViewMode('form');
    };

    const handleEdit = (t: Translation) => {
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

    return (
        <div className="fixed inset-0 z-50 flex items-center justify-center bg-black/40 p-4">
            <div className="w-full max-w-4xl bg-white rounded-lg shadow-lg overflow-hidden">
                <div className="px-6 py-4 border-b flex items-center justify-between">
                    {viewMode === 'list' ? (
                        <h3 className="text-lg font-medium">Quản lý dịch thuật - POI: {poi?.code}</h3>
                    ) : (
                        <h3 className="text-lg font-medium">Thêm/Sửa bản dịch</h3>
                    )}

                    <div className="flex items-center gap-2">
                        {viewMode === 'list' && (
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
                                            <th className="px-4 py-3 font-semibold w-[20%] text-right">Hành động</th>
                                        </tr>
                                    </thead>
                                    <tbody className="divide-y divide-gray-100">
                                        {isLoading ? (
                                            <tr>
                                                <td colSpan={4} className="px-4 py-6 text-center text-gray-500">Đang tải...</td>
                                            </tr>
                                        ) : isError ? (
                                            <tr>
                                                <td colSpan={4} className="px-4 py-6 text-center text-red-500">Lỗi khi tải dữ liệu</td>
                                            </tr>
                                        ) : (data?.length === 0) ? (
                                            <tr>
                                                <td colSpan={4} className="px-4 py-6 text-center text-gray-500">Chưa có bản dịch nào</td>
                                            </tr>
                                        ) : (
                                            (data ?? []).map((t: any) => (
                                                <tr key={t.id} className="hover:bg-gray-50 transition-colors">
                                                    <td className="px-4 py-3 font-medium text-gray-900">{t.languageCode}</td>
                                                    <td className="px-4 py-3 text-gray-700">{t.name}</td>
                                                    <td className="px-4 py-3 text-gray-500 truncate max-w-[200px]">{t.shortDescription}</td>
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
                                                </tr>
                                            ))
                                        )}
                                    </tbody>
                                </table>
                            </div>
                        </div>
                    ) : (
                        <div>
                            <div className="grid grid-cols-1 gap-4">
                                <div>
                                    <label className="block text-sm font-medium text-gray-700">Ngôn ngữ</label>
                                    <select
                                        value={editing?.languageCode}
                                        onChange={(e) => setEditing((s) => (s ? { ...s, languageCode: e.target.value } : s))}
                                        className="mt-1 block w-full border rounded px-3 py-2 text-sm"
                                    >
                                        <option value="" disabled>-- Chọn ngôn ngữ --</option>
                                        {(languages ?? []).map((language: any) => (
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
                                        onChange={(e) => setEditing((s) => (s ? { ...s, name: e.target.value } : s))}
                                        className="mt-1 block w-full border rounded px-3 py-2 text-sm"
                                    />
                                </div>

                                <div>
                                    <label className="block text-sm font-medium text-gray-700">Mô tả ngắn</label>
                                    <textarea
                                        rows={3}
                                        value={editing?.shortDescription ?? ''}
                                        onChange={(e) => setEditing((s) => (s ? { ...s, shortDescription: e.target.value } : s))}
                                        className="mt-1 block w-full border rounded px-3 py-2 text-sm"
                                    />
                                </div>

                                <div>
                                    <label className="block text-sm font-medium text-gray-700">Description</label>
                                    <textarea
                                        rows={6}
                                        value={editing?.description ?? ''}
                                        onChange={(e) => setEditing((s) => (s ? { ...s, description: e.target.value } : s))}
                                        className="mt-1 block w-full border rounded px-3 py-2 text-sm"
                                    />
                                </div>

                                <div className="flex justify-end gap-2 mt-4">
                                    <button
                                        type="button"
                                        className="px-4 py-2 bg-gray-200 hover:bg-gray-300 transition-colors rounded text-sm font-medium text-gray-700"
                                        onClick={() => {
                                            setViewMode('list');
                                            setEditing(null);
                                        }}
                                    >
                                        Hủy
                                    </button>
                                    <button
                                        type="button"
                                        className="px-4 py-2 bg-blue-600 hover:bg-blue-700 transition-colors text-white rounded text-sm font-medium"
                                        onClick={handleSave}
                                    >
                                        Lưu
                                    </button>
                                </div>
                            </div>
                        </div>
                    )}
                </div>
            </div>
        </div>
    );
}