# Khanh Hoi Demo Seed

This project now uses the Khanh Hoi, District 4 demo scenario.

## Map Center

- Label: Khánh Hội, Quận 4, TP.HCM
- Latitude: `10.76167`
- Longitude: `106.70250`
- Default zoom: `17`

## Optional Demo Seed

Development config keeps demo seed disabled by default:

```json
"SeedData": {
  "Enabled": false,
  "Scenario": "KhanhHoiDemo"
}
```

API startup only migrates the database schema. It must not create demo users, POIs, tours, QR codes, or packages. If demo data is ever needed for a throwaway environment, run the seeder intentionally outside the normal startup flow.

## Seeded Content

Users and roles:

- `admin@khanhhoi.demo`
- `vendor.cafe@khanhhoi.demo`
- `vendor.amthuc@khanhhoi.demo`
- `vendor.luuniem@khanhhoi.demo`

Languages:

- `vi`, `en`, `zh`, `ko`, `ja`

Public POIs:

- `KHANHHOI_DINH_KHANH_HOI`
- `KHANHHOI_CONG_VIEN`
- `KHANHHOI_BEN_VAN_DON`
- `KHANHHOI_CAU_KHANH_HOI`
- `KHANHHOI_CAFE_BEN_SONG`
- `KHANHHOI_AM_THUC_DIA_PHUONG`
- `KHANHHOI_LUU_NIEM_CAU_CANG`

Vendor lifecycle demo POIs:

- `KHANHHOI_VENDOR_CHO_DUYET`
- `KHANHHOI_VENDOR_DA_DUYET`
- `KHANHHOI_VENDOR_CHO_THANH_TOAN`

Tours:

- `KHANHHOI_WALKING_TOUR`
- `KHANHHOI_FOOD_AND_LOCAL_LIFE`

QR/package codes:

- `KHANHHOI_BASIC`
- `KHANHHOI_FULL_DAY`
- `KHANHHOI_TOUR_FOOD`
- `KHANHHOI_WALKING_TOUR_QR`
- `KHANHHOI_CAFE_BEN_SONG_QR`

Demo guest access token:

- `khanhhoi-demo-access-token`

## Media and Audio

The seeder creates small development placeholder PNG files under the protected upload model and creates `MediaFile` records for approved/pending image workflows.

The seeder does not create fake MP3/audio tracks. Add MP3 narration through the existing admin upload flow when real playable audio is available.

## Re-run Safety

If manually enabled for a throwaway environment, the seed is safe to re-run:

- Users are matched by email.
- POIs, tours, and QR records are matched by code.
- Translations and tour stops use existing unique keys.
- Demo files are only created if missing.
- No existing non-demo user data is deleted.

Normal development should keep the scenario disabled:

```json
"SeedData": {
  "Enabled": false,
  "Scenario": "KhanhHoiDemo"
}
```
