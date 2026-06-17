interface GuestAccessRecord {
  qrCode: string;
  accessToken: string;
  expiresAt: string;
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

  remove(qrCode: string): void {
    const records = readRecords();
    delete records[qrCode];
    writeRecords(records);
  },
};

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
