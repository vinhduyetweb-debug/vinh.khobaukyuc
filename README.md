# KHOBAUKYUC Hybrid PWA

## Quy chuẩn
- Tên app/thư mục/file: tiếng Việt không dấu.
- Root folder bắt buộc: `KHOBAUKYUC`.
- Ngày hệ thống: `YYMMDD`, ví dụ `260509`.
- Giai đoạn tuổi: `00_01_TUOI` đến `17_18_TUOI`.

## Tính năng
- Timeline 0–18 tuổi.
- Thêm kỷ niệm: ngày, YYMMDD, tuổi, sự kiện, tiêu đề, cảm xúc, tag, ghi chú.
- Upload ảnh offline và tự nén.
- Gắn link Google Drive ảnh gốc.
- Gắn link YouTube video và xem trong app.
- Gắn link Google Drive video.
- Google Drive API settings: API Key, OAuth Client ID, link folder KHOBAUKYUC.
- Backup/restore JSON.
- Copy cấu trúc thư mục.
- Story mode, album grid, tìm kiếm, lọc.

## Lưu ý
Bản V1 test/list thư mục root public bằng API Key. Quét đệ quy và OAuth private folder sẽ là bản Pro.


## V2 bo sung
- Moi muc timeline co nut `+` de them ky niem nhanh theo dung tuoi.
- Hien thi khung duong dan luu tru chinh.
- Copy root path `KHOBAUKYUC/`.
- Copy duong dan tuoi dang xem.
- Copy checklist backup thu cong.
- Button mo thu muc Google Drive goc.
- Button mo thu muc tuoi dang xem / backup: V2 mo root Drive; ban Pro se map chinh xac folder con bang Drive API.
- Moi ky niem co nut xuat file ghi chu TXT.
- Goi y ten file theo chuan `YYMMDD_su-kien_001.jpg`.


## V3 bo sung File System Engine
- Nut `Chon thu muc KHOBAUKYUC` de chon thu muc that tren may neu trinh duyet ho tro.
- App tu tao cau truc thu muc con trong thu muc da chon.
- Anh offline moi van luu IndexedDB, dong thoi neu co thu muc that se ghi them file JPG vao:
  `KHOBAUKYUC/XX_YY_TUOI/ANH_OFFLINE/`
- Nut `Luu anh hien co ra thu muc` de dong bo anh da luu trong IndexedDB ra thu muc that.
- Nut `Export ZIP` de xuat toan bo cau truc KHOBAUKYUC kem anh offline, ghi chu TXT, memories.json.
- Fallback cho iPhone/iPad: neu Safari khong ho tro chon thu muc, dung IndexedDB + Export ZIP.

## KHOBAUKYUC V4 PERSONAL PRO - QA PASS

Release checkpoint: `KHOBAUKYUC_V4_PERSONAL_PRO_QA_PASS`

Trang thai:
- QA result: PASS.
- Deployment compatibility: PASS.
- Data safety: PASS.
- No absolute paths: PASS.

V4 Personal Pro da qua vong kiem tra cuoi voi cac luong chinh:
- App mo tu `index.html`.
- Static Vercel deployment van dung `outputDirectory: "."` va empty build command.
- Memories cu load tu IndexedDB sau refresh.
- Them, sua, xoa memory hoat dong.
- Upload va nen anh hoat dong.
- Backup JSON, import JSON, export ZIP hoat dong.
- File System Access fallback hoat dong.
- Search/filter va random memory hoat dong.
- Future Letters tao, sua, xem, xoa, backup, ZIP, import va persist sau refresh.
- Khong co console errors trong normal usage.

Manual backup checklist:
1. Mo app KHOBAUKYUC tren trinh duyet dang luu du lieu.
2. Bam `Export JSON` trong Backup Health Check.
3. Bam `Export ZIP` de luu cau truc kem anh offline va Future Letters.
4. Luu ca hai file vao thu muc backup an toan, vi du `KHOBAUKYUC/00_CONFIG/backup/`.
5. Neu co Google Drive, upload ban backup JSON va ZIP len thu muc KHOBAUKYUC.
6. Sau khi backup, kiem tra ngay backup trong Backup Health Check.
7. Khong xoa du lieu trong trinh duyet cho den khi da mo thu file backup tren may khac hoac profile khac.

Known limitations:
- ZIP export dung JSZip local tai `vendor/jszip.min.js`; neu file nay bi thieu thi app se fallback ve JSON backup.
- File System Access API phu thuoc trinh duyet.
- iPhone/Safari dung IndexedDB + JSON/ZIP export fallback.
- Google Drive hien van o muc public/API-key/link based, chua co OAuth.
- Chua co automated test suite.

Huong tiep theo: `KHOBAUKYUC V5 STORAGE & DRIVE PRO`
- V5.1 Local bundled ZIP library: da chuyen JSZip sang file local `vendor/jszip.min.js`.
- Storage quota dashboard.
- Backup integrity checksums.
- Optional Drive folder mapping.
- Safer restore preview.
- Better long-term media storage strategy.
- Automated test suite neu phu hop.

## KHOBAUKYUC V5.3 - Backup Manifest and Checksum

V5.3 bo sung manifest cho ban backup de viec luu tru dai han de kiem tra hon.

JSON backup hien co them truong `manifest` nhung van giu cac truong cu:
- `app_name`
- `version`
- `schemaVersion`
- `root_folder`
- `exported_at`
- `folder_structure`
- `settings`
- `profiles`
- `memories`
- `futureLetters`

ZIP backup hien co them file:
- `KHOBAUKYUC/00_CONFIG/backup_manifest.json`

File ZIP van giu:
- `KHOBAUKYUC/00_CONFIG/memories.json`
- `KHOBAUKYUC/00_CONFIG/folder_map.json`
- cac thu muc tuoi, anh offline, ghi chu TXT va Future Letters TXT.

Checksum:
- Dung `SHA-256` bang Web Crypto API neu trinh duyet ho tro.
- Neu trinh duyet khong ho tro, backup van duoc tao va manifest se ghi canh bao.
- `payloadChecksum` giup kiem tra noi dung JSON backup chinh.
- `recordChecksums` giup kiem tra profile, memory, photo va Future Letter rieng le.

Luu y an toan du lieu:
- Manifest va checksum giup phat hien backup bi sai lech, nhung khong thay the viec export JSON/ZIP thuong xuyen.
- Nen luu it nhat hai ban backup o hai noi khac nhau, vi du may tinh ca nhan va Google Drive.
- Truoc khi xoa du lieu trinh duyet, hay mo thu file JSON/ZIP va kiem tra co `manifest` hoac `backup_manifest.json`.

## KHOBAUKYUC V5.4 - Restore Preview Before Import

V5.4 them buoc xem truoc truoc khi import JSON. Chon file backup se khong ghi ngay vao IndexedDB.

Restore preview hien thi:
- nguon backup, phien ban backup, schema va ngay export.
- trang thai manifest/checksum.
- so ky uc, anh offline, thu gui con va link online trong backup.
- so record them moi va so record trung ID.
- canh bao voi backup cu chua co manifest/checksum.

Chien luoc import:
- `Skip existing`: chi them record chua co ID trong app hien tai.
- `Overwrite existing`: giu hanh vi cu, record trong backup se ghi de record trung ID sau xac nhan ro rang.
- `Duplicate as new`: voi ky uc va Future Letters trung ID, tao ID moi va them `importedFromId`, `importedAt`.

Khuyen nghi an toan:
- Luon export JSON/ZIP hien tai truoc khi import backup khac.
- Neu chi muon kiem tra backup, chon Cancel trong preview.
- Backup cu khong co manifest van import duoc, nhung can xem canh bao ky hon.

## KHOBAUKYUC V5.5 - Long-term Media Storage Strategy

V5.5 them phan chien luoc luu anh/video dai han trong Backup/Storage Health.

Nguyen tac:
- Anh nen trong app chi nen dung de xem nhanh.
- Anh/video goc nen luu o Google Drive, o cung ngoai, NAS hoac thu muc backup rieng.
- Video nen luu bang link YouTube/Google Drive thay vi nhung truc tiep vao app.
- Trinh duyet khong phai kho luu tru vinh vien.
- Khong nen dua toan bo ky uc 0-18 nam vao IndexedDB ma khong co backup ngoai.

Media risk dashboard hien thi:
- tong anh offline.
- dung luong anh offline uoc tinh.
- tong link anh Google Drive.
- tong link YouTube.
- tong link video Google Drive.
- phan tram dung luong trinh duyet neu trinh duyet ho tro.

Muc rui ro:
- `Thap`: anh offline duoi 100 MB va dung luong trinh duyet duoi 50%.
- `Trung binh`: anh offline 100-500 MB hoac dung luong trinh duyet 50-75%.
- `Cao`: anh offline 500 MB-1 GB hoac dung luong trinh duyet 75-90%.
- `Nguy cap`: anh offline tren 1 GB hoac dung luong trinh duyet tu 90% tro len.

ZIP backup co them file khong bat buoc:
- `KHOBAUKYUC/00_CONFIG/media_storage_strategy.txt`

File nay chi la ghi chu huong dan luu tru dai han, khong thay doi dinh dang backup JSON va khong anh huong import.

Checklist khuyen nghi:
- Export ZIP moi thang.
- Export JSON sau moi lan nhap nhieu ky uc.
- Luu anh/video goc o it nhat 2 noi.
- Kiem tra file ZIP mo duoc sau khi export.
- Khong doi ten JSON thanh ZIP thu cong.

## KHOBAUKYUC V5.6 - Final QA Release Checkpoint

Release checkpoint: `KHOBAUKYUC_V5_STORAGE_DRIVE_PRO_QA_PASS`

Trang thai:
- QA result: PASS.
- Static Vercel deployment compatibility: PASS.
- Data safety checks: PASS.
- No IndexedDB schema change: PASS.
- No absolute paths: PASS.

V5.1-V5.5 da qua kiem tra cuoi:
- App mo tu `index.html` va render timeline.
- Existing IndexedDB data load lai sau refresh.
- Them, sua, xoa ky uc hoat dong.
- Upload PNG va nen thanh JPEG preview hoat dong.
- Future Letters tao, xem, sua, xoa hoat dong.
- Storage Quota Dashboard va Long-term Media Strategy hien thi.
- JSON backup co manifest va `payloadChecksum`.
- ZIP backup mo duoc va co `memories.json`, `backup_manifest.json`, `media_storage_strategy.txt`, `folder_map.json`.
- Restore Preview hien truoc khi import.
- Cancel va Skip existing khong ghi de du lieu.
- Overwrite existing co canh bao ro.
- Duplicate as new tao ban sao ky uc va Future Letter.

Nhac an toan du lieu:
- Trinh duyet khong phai kho luu tru vinh vien.
- Luon export JSON/ZIP truoc khi import backup khac.
- Luu anh/video goc o it nhat hai noi.
- Kiem tra file ZIP mo duoc sau khi export.

## KHOBAUKYUC V6.0 - Family Drive Workflow Release

V6.0 bo sung quy trinh luu anh/video goc tren Google Drive theo cach thu cong,
khong them backend, OAuth, Drive sync hoac thay doi IndexedDB schema.

Tinh nang:
- Drive Root Folder Link trong Cai dat.
- Suggested Filename va Suggested Drive Path trong Quick Add va Full Editor.
- Link Drive/YouTube co the nhap ngay trong Quick Add.
- Kiem tra dinh dang link Google Drive va YouTube truoc khi luu.
- Media Coverage summary de tim ky niem con thieu link media goc.
- Media Upload Queue de mo lai ky niem va bo sung link Drive.
- Family Drive Checklist de copy cho nguoi dung.
- Thong bao ro rang rang upload, di chuyen va chia se file Drive van lam thu cong.

An toan du lieu:
- Khong thay doi IndexedDB schema.
- Khong thay doi JSON backup, ZIP backup, manifest, checksum hoac Restore Preview.
- Anh nen trong app van chi dung de xem nhanh.
- Anh/video goc can luu o it nhat hai noi.
- Du lieu tren cac dien thoai khong tu dong dong bo voi nhau.

## KHOBAUKYUC V6.0.1 - File Naming Standard V1

Suggested Filename trong Quick Add va Full Editor dung dinh dang:

```text
YYMMDD_TYPE_EVENT-SLUG_SEQUENCE.EXT
```

Vi du:

```text
240905_IMG_NGAY-DAU-DEN-TRUONG_0001.jpg
240905_IMG_NGAY-DAU-DEN-TRUONG_0002.jpg
240905_VID_NGAY-DAU-DEN-TRUONG_0001.mp4
240905_PDF_GIAY-KHEN-HOC-KY-1_0001.pdf
```

Quy tac:
- `TYPE`: `IMG`, `VID`, `PDF`, `AUD`.
- Event slug bo dau tieng Viet, viet hoa va dung dau `-`.
- Sequence co 4 chu so, bat dau tu `0001`.
- Extension goc duoc giu lai khi file da chon co ten file.
- Suggested Drive Path hien thi kem ten file de de copy dung vi tri.

V6.0.1 chi thay doi goi y ten file. Khong thay doi IndexedDB schema, backup,
import, export, manifest, checksum hoac Restore Preview.
