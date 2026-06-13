import { httpClient } from '../../../api/httpClient';
import type { ApiResponse, PagedResult } from '../../../types/api';

export const poisApi = {
    async getAll(page = 1, pageSize = 20) {
        const res = await httpClient.get<ApiResponse<PagedResult<any>>>('/pois', {
            params: { page, pageSize },
        });
        return res.data.data;
    },

    // 1. Ép kiểu dữ liệu nhận vào BẮT BUỘC phải là FormData
    async create(data: FormData) {
        const res = await httpClient.post<ApiResponse<any>>('/pois', data, {
            // 2. Ép httpClient phải gửi dưới dạng Multipart, cấm tự động chuyển sang JSON
            headers: {
                'Content-Type': 'multipart/form-data'
            }
        });
        return res.data.data;
    },

    // Làm tương tự với hàm update
    async update(id: number, data: FormData) {
        const res = await httpClient.put<ApiResponse<any>>(`/pois/${id}`, data, {
            headers: {
                'Content-Type': 'multipart/form-data'
            }
        });
        return res.data.data;
    },

    async delete(id: number) {
        await httpClient.delete(`/pois/${id}`);
    },
};

export default poisApi;