import { isAccessExpired, parseAccessExpiresAt } from './accessTime';

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

    if (isAccessExpired(record.expiresAt)) {
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

  getAllActive(): GuestAccessRecord[] {
    const records = readRecords();
    const activeRecords: GuestAccessRecord[] = [];
    let changed = false;

    for (const [qrCode, record] of Object.entries(records)) {
      if (isAccessExpired(record.expiresAt)) {
        delete records[qrCode];
        changed = true;
        continue;
      }

      activeRecords.push(record);
    }

    if (changed) {
      writeRecords(records);
    }

    return activeRecords;
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
    if (isAccessExpired(record.expiresAt)) {
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
    if (!raw) {
      return {};
    }

    const parsed: unknown = JSON.parse(raw);
    if (!parsed || typeof parsed !== 'object' || Array.isArray(parsed)) {
      return {};
    }

    return Object.fromEntries(
      Object.entries(parsed).filter((entry): entry is [string, GuestAccessRecord] => isGuestAccessRecord(entry[1])),
    );
  } catch {
    return {};
  }
}

function writeRecords(records: Record<string, GuestAccessRecord>): void {
  try {
    window.localStorage.setItem(STORAGE_KEY, JSON.stringify(records));
  } catch {
    // Storage can be unavailable in private browsing or when the browser quota is full.
  }
}

function isGuestAccessRecord(value: unknown): value is GuestAccessRecord {
  if (!value || typeof value !== 'object') {
    return false;
  }

  const record = value as Partial<GuestAccessRecord>;
  return typeof record.qrCode === 'string'
    && record.qrCode.length > 0
    && typeof record.accessToken === 'string'
    && record.accessToken.length > 0
    && typeof record.expiresAt === 'string'
    && Number.isFinite(parseAccessExpiresAt(record.expiresAt));
}
