import React, { useEffect, useState } from 'react';
import { useMutation, useQueryClient } from '@tanstack/react-query';
import { languagesApi } from '../api/languagesApi';
import { useToast } from '../../../components/ui/Toast';

interface Props {
  isOpen: boolean;
  onClose: () => void;
  initialData?: any | null;
}

export default function LanguageModal({ isOpen, onClose, initialData }: Props) {
  const [code, setCode] = useState('');
  const [name, setName] = useState('');
  const [nativeName, setNativeName] = useState('');
  const [sortOrder, setSortOrder] = useState<number>(0);
  const [isActive, setIsActive] = useState<boolean>(true);
  const qc = useQueryClient();
  const toast = useToast();

  useEffect(() => {
    if (isOpen) {
      setCode(initialData?.code ?? '');
      setName(initialData?.name ?? '');
      setNativeName(initialData?.nativeName ?? '');
      setSortOrder(initialData?.sortOrder ?? 0);
      setIsActive(initialData?.isActive ?? true);
    }
  }, [isOpen, initialData]);

  const saveMutation = useMutation({
    mutationFn: async (payload: any) => {
      if (initialData?.code) {
        return languagesApi.update(initialData.code, payload);
      }
      return languagesApi.create(payload);
    },
    onSuccess: () => {
      qc.invalidateQueries({ queryKey: ['languages'] });
      toast('Lưu thành công', 'success');
      onClose();
    },
  });

  if (!isOpen) return null;

  return (
    <div className="fixed inset-0 z-50 flex items-center justify-center bg-black/40 p-4">
      <div className="w-full max-w-lg bg-white rounded-lg shadow-lg overflow-hidden">
        <div className="px-6 py-4 border-b flex items-center justify-between">
          <h3 className="text-lg font-medium">{initialData ? 'Sửa ngôn ngữ' : 'Thêm ngôn ngữ'}</h3>
          <button className="text-gray-500 hover:text-gray-700" onClick={onClose}>✕</button>
        </div>

        <form
          onSubmit={async (e) => {
            e.preventDefault();

            // Basic validation
            if (!code || code.trim() === '') {
              toast('Mã (code) không được để trống', 'error');
              return;
            }
            if (!name || name.trim() === '') {
              toast('Tên (name) không được để trống', 'error');
              return;
            }
            if (!nativeName || nativeName.trim() === '') {
              toast('Tên bản địa (native name) không được để trống', 'error');
              return;
            }
            if (sortOrder === null || Number.isNaN(sortOrder)) {
              toast('Thứ tự (sort order) không hợp lệ', 'error');
              return;
            }

            await saveMutation.mutateAsync({ code, name, nativeName, sortOrder, isActive });
          }}
        >
          <div className="p-6">
            <div className="grid grid-cols-1 gap-4">
              <div>
                <label className="block text-sm font-medium text-gray-700">Code</label>
                <input
                  type="text"
                  value={code}
                  onChange={(e) => setCode(e.target.value)}
                  className={`mt-1 block w-full border rounded px-2 py-1 text-sm ${initialData?.code ? 'bg-gray-100 cursor-not-allowed' : ''}`}
                  disabled={!!initialData?.code}
                  required
                />
              </div>

              <div>
                <label className="block text-sm font-medium text-gray-700">Name</label>
                <input type="text" value={name} onChange={(e) => setName(e.target.value)} className="mt-1 block w-full border rounded px-2 py-1 text-sm" required />
              </div>

              <div>
                <label className="block text-sm font-medium text-gray-700">Native Name</label>
                <input type="text" value={nativeName} onChange={(e) => setNativeName(e.target.value)} className="mt-1 block w-full border rounded px-2 py-1 text-sm" required />
              </div>

              <div>
                <label className="block text-sm font-medium text-gray-700">Sort Order</label>
                <input type="number" value={sortOrder} onChange={(e) => setSortOrder(Number(e.target.value))} className="mt-1 block w-full border rounded px-2 py-1 text-sm" required />
              </div>

              <div className="flex items-center gap-2">
                <input type="checkbox" checked={isActive} onChange={(e) => setIsActive(e.target.checked)} id="isActive" />
                <label htmlFor="isActive" className="text-sm text-gray-700">Is Active</label>
              </div>

              <div className="flex justify-end gap-2">
                <button type="button" className="px-4 py-2 bg-gray-200 rounded" onClick={onClose}>Hủy</button>
                <button type="submit" className="px-4 py-2 bg-blue-600 text-white rounded">Lưu</button>
              </div>
            </div>
          </div>
        </form>
      </div>
    </div>
  );
}
