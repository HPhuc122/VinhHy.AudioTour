import { useState } from 'react';
import { useMutation, useQuery, useQueryClient } from '@tanstack/react-query';
import { Button } from '../../../components/ui/Button';
import { languagesApi } from '../api/languagesApi';
import LanguageModal from '../components/LanguageModal';

export function LanguagePage() {
  const qc = useQueryClient();
  const { data, isLoading, isError } = useQuery({
    queryKey: ['languages'],
    queryFn: languagesApi.getAll,
  });
  const deleteMutation = useMutation({
    mutationFn: (code: string) => languagesApi.delete(code),
    onSuccess: () => qc.invalidateQueries({ queryKey: ['languages'] }),
  });

  const [modalOpen, setModalOpen] = useState(false);
  const [editing, setEditing] = useState<any | null>(null);

  return (
    <div>
      <div className="flex items-center justify-between">
        <div>
          <h1 className="text-2xl font-bold text-gray-900">Quản lý ngôn ngữ</h1>
          <p className="mt-0.5 text-sm text-gray-500">
            Quản lý các ngôn ngữ hỗ trợ cho ứng dụng
          </p>
        </div>
        <Button onClick={() => { setEditing(null); setModalOpen(true); }}>
          + Thêm mới
        </Button>
      </div>

      <div className="mt-6 rounded-xl border border-gray-100 bg-white p-6 shadow-sm">
        <div className="overflow-x-auto">
          <table className="min-w-full text-sm">
            <thead className="text-left text-xs uppercase text-gray-500">
              <tr>
                <th className="px-3 py-2">Mã</th>
                <th className="px-3 py-2">Tên</th>
                <th className="px-3 py-2">Tên bản địa</th>
                <th className="px-3 py-2">Thứ tự</th>
                <th className="px-3 py-2">Trạng thái</th>
                <th className="px-3 py-2">Thao tác</th>
              </tr>
            </thead>
            <tbody>
              {isLoading ? (
                <tr>
                  <td colSpan={6} className="px-3 py-4 text-center text-gray-500">
                    Đang tải...
                  </td>
                </tr>
              ) : isError ? (
                <tr>
                  <td colSpan={6} className="px-3 py-4 text-center text-red-500">
                    Không thể tải dữ liệu ngôn ngữ
                  </td>
                </tr>
              ) : (
                (data ?? []).map((lang: any) => (
                  <tr key={lang.code} className="border-t">
                    <td className="px-3 py-2 font-medium">{lang.code}</td>
                    <td className="px-3 py-2">{lang.name}</td>
                    <td className="px-3 py-2">{lang.nativeName}</td>
                    <td className="px-3 py-2">{lang.sortOrder}</td>
                    <td className="px-3 py-2">
                      {lang.isActive ? (
                        <span className="inline-flex items-center rounded-full bg-green-100 px-2.5 py-0.5 text-xs font-medium text-green-800">
                          Hoạt động
                        </span>
                      ) : (
                        <span className="inline-flex items-center rounded-full bg-red-100 px-2.5 py-0.5 text-xs font-medium text-red-800">
                          Tạm tắt
                        </span>
                      )}
                    </td>
                    <td className="px-3 py-2">
                      <div className="flex gap-2">
                        <button
                          className="rounded bg-yellow-500 px-2 py-1 text-white"
                          onClick={() => { setEditing(lang); setModalOpen(true); }}
                        >
                          Sửa
                        </button>
                        <button
                          className="rounded bg-red-500 px-2 py-1 text-white"
                          onClick={async () => {
                            if (!window.confirm('Bạn có chắc chắn muốn xóa ngôn ngữ này?')) {
                              return;
                            }
                            await deleteMutation.mutateAsync(lang.code);
                          }}
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

      <LanguageModal
        isOpen={modalOpen}
        onClose={() => setModalOpen(false)}
        initialData={editing}
      />
    </div>
  );
}

export default LanguagePage;
