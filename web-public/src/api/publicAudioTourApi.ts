import { httpClient } from './httpClient';
import type { ApiResponse } from '../types/api';

export interface PublicAudioTourAudioDto {
  id: number;
  audioTrackId: number;
  languageCode: string;
  language: string;
  title: string;
  audioType: string;
  durationSeconds?: number | null;
  duration?: number | null;
  fileSizeBytes?: number | null;
  mimeType?: string | null;
  isAvailable: boolean;
}

export type AudioTourTriggerType = 'manual' | 'gps' | 'qr';

export interface PublicAudioTourPoiDto {
  id: number;
  code: string;
  name: string;
  shortDescription?: string | null;
  narrationText?: string | null;
  latitude: number;
  longitude: number;
  imageUrl?: string | null;
  category?: string | null;
  orderIndex: number;
  audioTracks: PublicAudioTourAudioDto[];
}

export interface PublicAudioTourTourDto {
  id: number;
  code: string;
  name: string;
  description?: string | null;
  defaultLanguage: string;
  estimatedMinutes?: number | null;
  pois: PublicAudioTourPoiDto[];
}

export const publicAudioTourApi = {
  async getTour(tourId: number, accessToken: string, languageCode = 'vi'): Promise<PublicAudioTourTourDto> {
    const res = await httpClient.get<ApiResponse<PublicAudioTourTourDto>>(
      `/public/audio-tour/tours/${tourId}`,
      {
        params: { languageCode },
        headers: { 'X-Guest-Access-Token': accessToken },
      },
    );
    return filterAudioByLanguage(res.data.data, languageCode);
  },

  async getPoi(
    poiId: number,
    accessToken: string,
    languageCode = 'vi',
    triggerType: AudioTourTriggerType = 'manual',
  ): Promise<PublicAudioTourPoiDto> {
    const res = await httpClient.get<ApiResponse<PublicAudioTourPoiDto>>(
      `/public/audio-tour/pois/${poiId}`,
      {
        params: { languageCode, triggerType },
        headers: { 'X-Guest-Access-Token': accessToken },
      },
    );
    return filterPoiAudioByLanguage(res.data.data, languageCode);
  },

  async getAudioBlob(audioTrackId: number, accessToken: string): Promise<Blob> {
    const res = await httpClient.get<Blob>(`/public/audio/${audioTrackId}`, {
      headers: { 'X-Guest-Access-Token': accessToken },
      responseType: 'blob',
    });

    if (!isPlayableAudioBlob(res.data)) {
      throw new Error('invalid-audio');
    }

    return res.data;
  },
};

function filterAudioByLanguage(tour: PublicAudioTourTourDto, languageCode: string): PublicAudioTourTourDto {
  return {
    ...tour,
    pois: tour.pois.map((poi) => filterPoiAudioByLanguage(poi, languageCode)),
  };
}

function filterPoiAudioByLanguage(
  poi: PublicAudioTourPoiDto,
  languageCode: string,
): PublicAudioTourPoiDto {
  const normalizedLanguage = languageCode.trim().toLowerCase();
  return {
    ...poi,
    audioTracks: poi.audioTracks.filter(
      (track) => track.languageCode.trim().toLowerCase() === normalizedLanguage,
    ),
  };
}

function isPlayableAudioBlob(blob: Blob): boolean {
  if (!blob || blob.size <= 0) {
    return false;
  }

  return !blob.type || blob.type.startsWith('audio/');
}
