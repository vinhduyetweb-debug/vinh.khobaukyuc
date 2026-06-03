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
