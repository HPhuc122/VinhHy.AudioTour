export interface GuestAccessRecord {
  qrCode: string;
  accessToken: string;
  expiresAt: string;
  poiId?: number | null;
  tourId?: number | null;
}

const STORAGE_KEY = 'vinhhy.guestAccessPasses';

export const guestAccessStore = {
  get(qrCode: string): GuestAccessRecord | null {
    const records = readRecords();
    const record = records[qrCode];
    if (!record) {
      return null;
    }

    if (new Date(record.expiresAt).getTime() <= Date.now()) {
      delete records[qrCode];
      writeRecords(records);
      return null;
    }

    return record;
  },

  set(record: GuestAccessRecord): void {
    const records = readRecords();
    records[record.qrCode] = record;
    writeRecords(records);
  },

  getForTour(tourId: number): GuestAccessRecord | null {
    return findRecord((record) => record.tourId === tourId);
  },

  getForPoi(poiId: number): GuestAccessRecord | null {
    return findRecord((record) => record.poiId === poiId);
  },

  getAnyActive(): GuestAccessRecord | null {
    return findRecord(() => true);
  },

  remove(qrCode: string): void {
    const records = readRecords();
    delete records[qrCode];
    writeRecords(records);
  },
};

function findRecord(predicate: (record: GuestAccessRecord) => boolean): GuestAccessRecord | null {
  const records = readRecords();
  let changed = false;

  for (const [qrCode, record] of Object.entries(records)) {
    if (new Date(record.expiresAt).getTime() <= Date.now()) {
      delete records[qrCode];
      changed = true;
      continue;
    }

    if (predicate(record)) {
      if (changed) {
        writeRecords(records);
      }
      return record;
    }
  }

  if (changed) {
    writeRecords(records);
  }

  return null;
}

function readRecords(): Record<string, GuestAccessRecord> {
  try {
    const raw = window.localStorage.getItem(STORAGE_KEY);
    return raw ? (JSON.parse(raw) as Record<string, GuestAccessRecord>) : {};
  } catch {
    return {};
  }
}

function writeRecords(records: Record<string, GuestAccessRecord>): void {
  window.localStorage.setItem(STORAGE_KEY, JSON.stringify(records));
}
