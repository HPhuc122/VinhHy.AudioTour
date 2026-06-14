import { httpClient } from '../../../api/httpClient';

export const languagesApi = {
    async getAll() {
        // Thêm tham số để báo Backend trả về toàn bộ (cả IsActive = false)
        const res = await httpClient.get('/languages?activeOnly=false');
        return res.data.data;
    },

    // Đổi id: number thành code: string cho đúng kiểu dữ liệu Khóa chính
    async getById(code: string) {
        const res = await httpClient.get(`/languages/${code}`);
        return res.data.data;
    },

    async create(data: any) {
        const res = await httpClient.post('/languages', data);
        return res.data.data;
    },

    async update(code: string, data: any) {
        const res = await httpClient.put(`/languages/${code}`, data);
        return res.data.data;
    },

    async delete(code: string) {
        await httpClient.delete(`/languages/${code}`);
    },
};

export default languagesApi;