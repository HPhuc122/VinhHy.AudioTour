import { httpClient } from '../../../api/httpClient';

export const poiTranslationsApi = {
    // Lấy danh sách (Khớp với [HttpGet("by-poi/{poiId:int}")])
    getByPoiId: async (poiId: number) => {
        const res = await httpClient.get(`/poi-translations/by-poi/${poiId}`);
        return res.data.data;
    },

    // Thêm mới (Khớp với [HttpPost])
    // Vì URL không còn poiId, ta phải nhét poiId vào trong gói data (body)
    create: async (poiId: number, data: any) => {
        const payload = { ...data, poiId };
        const res = await httpClient.post(`/poi-translations`, payload);
        return res.data.data;
    },

    // Cập nhật (Khớp với [HttpPut("{id:int}")])
    update: async (poiId: number, translationId: number, data: any) => {
        const payload = { ...data, poiId };
        const res = await httpClient.put(`/poi-translations/${translationId}`, payload);
        return res.data.data;
    },

    // Xóa (Khớp với [HttpDelete("{id:int}")])
    delete: async (poiId: number, translationId: number) => {
        await httpClient.delete(`/poi-translations/${translationId}`);
    }
};