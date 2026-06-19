import { httpClient } from '@/api/httpClient';

const POI_TRANSLATIONS_BASE = '/api/v1/poi-translations';

export const poiTranslationsApi = {
  async getByPoiId(poiId: number) {
    const response = await httpClient.get(`${POI_TRANSLATIONS_BASE}/by-poi/${poiId}`);
    return response.data.data;
  },

  async create(poiId: number, data: any) {
    const payload = { ...data, poiId };
    const response = await httpClient.post(POI_TRANSLATIONS_BASE, payload);
    return response.data.data;
  },

  async update(poiId: number, translationId: number, data: any) {
    const payload = { ...data, poiId };
    const response = await httpClient.put(`${POI_TRANSLATIONS_BASE}/${translationId}`, payload);
    return response.data.data;
  },

  async delete(_poiId: number, translationId: number) {
    await httpClient.delete(`${POI_TRANSLATIONS_BASE}/${translationId}`);
  },

  async generate(data: {
    poiId: number;
    sourceLanguageCode: string;
    targetLanguageCodes: string[];
    overwriteExisting: boolean;
  }) {
    const response = await httpClient.post(`${POI_TRANSLATIONS_BASE}/generate`, data);
    return response.data.data;
  },
};
