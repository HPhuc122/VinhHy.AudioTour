import { useEffect, useMemo, useState } from 'react';
import { useMutation, useQueryClient } from '@tanstack/react-query';
import { languagesApi } from '../api/languagesApi';
import { useToast } from '../../../components/ui/Toast';

interface Props {
  isOpen: boolean;
  onClose: () => void;
  initialData?: any | null;
}

const LANGUAGE_OPTIONS = [
  { code: 'vi', name: 'Vietnamese', nativeName: 'Tiếng Việt', sortOrder: 1 },
  { code: 'en', name: 'English', nativeName: 'English', sortOrder: 2 },
  { code: 'zh', name: 'Chinese', nativeName: '中文', sortOrder: 3 },
  { code: 'ko', name: 'Korean', nativeName: '한국어', sortOrder: 4 },
  { code: 'ja', name: 'Japanese', nativeName: '日本語', sortOrder: 5 },
  { code: 'fr', name: 'French', nativeName: 'Français', sortOrder: 6 },
];

export default function LanguageModal({ isOpen, onClose, initialData }: Props) {
  const [code, setCode] = useState('vi');
  const [name, setName] = useState('');
  const [nativeName, setNativeName] = useState('');
  const [sortOrder, setSortOrder] = useState<number>(1);
  const [isActive, setIsActive] = useState<boolean>(true);
  const queryClient = useQueryClient();
  const toast = useToast();

  const selectedLanguage = useMemo(
    () => LANGUAGE_OPTIONS.find((language) => language.code === code),
    [code],
  );

  useEffect(() => {
    if (!isOpen) {
      return;
    }

    if (initialData) {
      setCode(initialData.code ?? 'vi');
      setName(initialData.name ?? '');
      setNativeName(initialData.nativeName ?? '');
      setSortOrder(initialData.sortOrder ?? 1);
      setIsActive(initialData.isActive ?? true);
      return;
    }

    const first = LANGUAGE_OPTIONS[0]!;
    setCode(first.code);
    setName(first.name);
    setNativeName(first.nativeName);
    setSortOrder(first.sortOrder);
    setIsActive(true);
  }, [isOpen, initialData]);

  useEffect(() => {
    if (initialData || !selectedLanguage) {
      return;
    }

    setName(selectedLanguage.name);
    setNativeName(selectedLanguage.nativeName);
    setSortOrder(selectedLanguage.sortOrder);
  }, [initialData, selectedLanguage]);

  const saveMutation = useMutation({
    mutationFn: async (payload: any) => {
      if (initialData?.code) {
        return languagesApi.update(initialData.code, payload);
      }

      return languagesApi.create(payload);
    },
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ['languages'] });
      toast('Lưu thành công', 'success');
      onClose();
    },
  });

  if (!isOpen) {
    return null;
  }

  return (
    <div className="fixed inset-0 z-50 flex items-center justify-center bg-black/40 p-4">
      <div className="w-full max-w-lg overflow-hidden rounded-lg bg-white shadow-lg">
        <div className="flex items-center justify-between border-b px-6 py-4">
          <h3 className="text-lg font-medium">
            {initialData ? 'Sửa ngôn ngữ' : 'Thêm ngôn ngữ'}
          </h3>
          <button className="text-gray-500 hover:text-gray-700" onClick={onClose} aria-label="Đóng">
            ×
          </button>
        </div>

        <form
          onSubmit={async (event) => {
            event.preventDefault();

            if (!LANGUAGE_OPTIONS.some((language) => language.code === code)) {
              toast('Mã ngôn ngữ không được hỗ trợ', 'error');
              return;
            }

            if (!name.trim() || !nativeName.trim()) {
              toast('Tên ngôn ngữ không được để trống', 'error');
              return;
            }

            if (Number.isNaN(sortOrder)) {
              toast('Thứ tự sắp xếp không hợp lệ', 'error');
              return;
            }

            await saveMutation.mutateAsync({
              code,
              name: name.trim(),
              nativeName: nativeName.trim(),
              sortOrder,
              isActive,
            });
          }}
        >
          <div className="p-6">
            <div className="grid grid-cols-1 gap-4">
              <div>
                <label className="block text-sm font-medium text-gray-700">Mã ngôn ngữ</label>
                {initialData?.code ? (
                  <input
                    type="text"
                    value={code}
                    className="mt-1 block w-full cursor-not-allowed rounded border bg-gray-100 px-2 py-1 text-sm"
                    disabled
                  />
                ) : (
                  <select
                    value={code}
                    onChange={(event) => setCode(event.target.value)}
                    className="mt-1 block w-full rounded border px-2 py-1 text-sm"
                    required
                  >
                    {LANGUAGE_OPTIONS.map((language) => (
                      <option key={language.code} value={language.code}>
                        {language.nativeName} ({language.code})
                      </option>
                    ))}
                  </select>
                )}
              </div>

              <div>
                <label className="block text-sm font-medium text-gray-700">Tên ngôn ngữ</label>
                <input
                  type="text"
                  value={name}
                  onChange={(event) => setName(event.target.value)}
                  className="mt-1 block w-full rounded border px-2 py-1 text-sm"
                  required
                />
              </div>

              <div>
                <label className="block text-sm font-medium text-gray-700">Tên bản địa</label>
                <input
                  type="text"
                  value={nativeName}
                  onChange={(event) => setNativeName(event.target.value)}
                  className="mt-1 block w-full rounded border px-2 py-1 text-sm"
                  required
                />
              </div>

              <div>
                <label className="block text-sm font-medium text-gray-700">Thứ tự sắp xếp</label>
                <input
                  type="number"
                  value={sortOrder}
                  onChange={(event) => setSortOrder(Number(event.target.value))}
                  className="mt-1 block w-full rounded border px-2 py-1 text-sm"
                  required
                />
              </div>

              <div className="flex items-center gap-2">
                <input
                  type="checkbox"
                  checked={isActive}
                  onChange={(event) => setIsActive(event.target.checked)}
                  id="isActive"
                />
                <label htmlFor="isActive" className="text-sm text-gray-700">
                  Đang hoạt động
                </label>
              </div>

              <div className="flex justify-end gap-2">
                <button type="button" className="rounded bg-gray-200 px-4 py-2" onClick={onClose}>
                  Hủy
                </button>
                <button
                  type="submit"
                  className="rounded bg-blue-600 px-4 py-2 text-white"
                  disabled={saveMutation.isPending}
                >
                  {saveMutation.isPending ? 'Đang lưu...' : 'Lưu'}
                </button>
              </div>
            </div>
          </div>
        </form>
      </div>
    </div>
  );
}
