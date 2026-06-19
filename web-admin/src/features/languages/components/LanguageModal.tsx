import { useEffect, useMemo, useState } from 'react';
import { useMutation, useQueryClient } from '@tanstack/react-query';
import { languagesApi } from '../api/languagesApi';
import { useToast } from '../../../components/ui/Toast';

interface Props {
  isOpen: boolean;
  onClose: () => void;
}

const GOOGLE_LANGUAGES = [
  { code: 'vi', name: 'Vietnamese', nativeName: 'Tiếng Việt' },
  { code: 'en', name: 'English', nativeName: 'English' },
  { code: 'zh', name: 'Chinese', nativeName: '中文' },
  { code: 'ko', name: 'Korean', nativeName: '한국어' },
  { code: 'ja', name: 'Japanese', nativeName: '日本語' },
  { code: 'fr', name: 'French', nativeName: 'Français' },
  { code: 'es', name: 'Spanish', nativeName: 'Español' },
  { code: 'ru', name: 'Russian', nativeName: 'Русский' },
  { code: 'de', name: 'German', nativeName: 'Deutsch' },
  { code: 'th', name: 'Thai', nativeName: 'ไทย' },
  { code: 'it', name: 'Italian', nativeName: 'Italiano' },
  { code: 'pt', name: 'Portuguese', nativeName: 'Português' },
  { code: 'id', name: 'Indonesian', nativeName: 'Bahasa Indonesia' },
  { code: 'hi', name: 'Hindi', nativeName: 'हिन्दी' },
  { code: 'ar', name: 'Arabic', nativeName: 'العربية' },
  { code: 'nl', name: 'Dutch', nativeName: 'Nederlands' },
];

export default function LanguageModal({ isOpen, onClose }: Props) {
  const [selectedLanguageCode, setSelectedLanguageCode] = useState('');
  const [code, setCode] = useState('');
  const [name, setName] = useState('');
  const [nativeName, setNativeName] = useState('');
  const [sortOrder, setSortOrder] = useState<number>(1);
  const [isActive, setIsActive] = useState<boolean>(true);
  const queryClient = useQueryClient();
  const toast = useToast();

  const selectedLanguage = useMemo(
    () => GOOGLE_LANGUAGES.find((language) => language.code === selectedLanguageCode),
    [selectedLanguageCode],
  );

  useEffect(() => {
    if (!isOpen) {
      return;
    }

    setSelectedLanguageCode('');
    setCode('');
    setName('');
    setNativeName('');
    setSortOrder(1);
    setIsActive(true);
  }, [isOpen]);

  useEffect(() => {
    if (!selectedLanguage) {
      return;
    }

    setName(selectedLanguage.name);
    setNativeName(selectedLanguage.nativeName);
    setCode(selectedLanguage.code);
    setSortOrder(GOOGLE_LANGUAGES.findIndex((language) => language.code === selectedLanguage.code) + 1);
  }, [selectedLanguage]);

  const saveMutation = useMutation({
    mutationFn: languagesApi.create,
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ['languages'] });
      toast('Thêm ngôn ngữ thành công', 'success');
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
          <h3 className="text-lg font-medium">Thêm ngôn ngữ</h3>
          <button className="text-gray-500 hover:text-gray-700" onClick={onClose} aria-label="Đóng">
            ×
          </button>
        </div>

        <form
          onSubmit={async (event) => {
            event.preventDefault();

            if (!GOOGLE_LANGUAGES.some((language) => language.code === code)) {
              toast('Vui lòng chọn ngôn ngữ hỗ trợ', 'error');
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
                <label className="block text-sm font-medium text-gray-700">Chọn ngôn ngữ hỗ trợ</label>
                <select
                  value={selectedLanguageCode}
                  onChange={(event) => setSelectedLanguageCode(event.target.value)}
                  className="mt-1 block w-full rounded border px-2 py-1 text-sm"
                  required
                >
                  <option value="">-- Chọn ngôn ngữ --</option>
                  {GOOGLE_LANGUAGES.map((language) => (
                    <option key={language.code} value={language.code}>
                      {language.name} - {language.nativeName}
                    </option>
                  ))}
                </select>
              </div>

              <div>
                <label className="block text-sm font-medium text-gray-700">Mã ngôn ngữ</label>
                <input
                  type="text"
                  value={code}
                  className="mt-1 block w-full cursor-not-allowed rounded border bg-gray-100 px-2 py-1 text-sm text-gray-700"
                  readOnly
                  required
                />
              </div>

              <div>
                <label className="block text-sm font-medium text-gray-700">Tên ngôn ngữ</label>
                <input
                  type="text"
                  value={name}
                  className="mt-1 block w-full cursor-not-allowed rounded border bg-gray-100 px-2 py-1 text-sm text-gray-700"
                  readOnly
                  required
                />
              </div>

              <div>
                <label className="block text-sm font-medium text-gray-700">Tên bản địa</label>
                <input
                  type="text"
                  value={nativeName}
                  className="mt-1 block w-full cursor-not-allowed rounded border bg-gray-100 px-2 py-1 text-sm text-gray-700"
                  readOnly
                  required
                />
              </div>

              <div>
                <label className="block text-sm font-medium text-gray-700">Thứ tự sắp xếp</label>
                <input
                  type="number"
                  value={sortOrder}
                  className="mt-1 block w-full cursor-not-allowed rounded border bg-gray-100 px-2 py-1 text-sm text-gray-700"
                  readOnly
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
