# KHOBAUKYUC V6.0.1 - File Naming Standard V1

## Format

```text
YYMMDD_TYPE_EVENT-SLUG_SEQUENCE.EXT
```

## Vi du

```text
240905_IMG_NGAY-DAU-DEN-TRUONG_0001.jpg
240905_IMG_NGAY-DAU-DEN-TRUONG_0002.jpg
240905_VID_NGAY-DAU-DEN-TRUONG_0001.mp4
240905_PDF_GIAY-KHEN-HOC-KY-1_0001.pdf
```

## Quy tac

- Ngay lay tu ngay ky niem theo dinh dang `YYMMDD`.
- Type gom `IMG`, `VID`, `PDF`, `AUD`.
- Event slug bo dau tieng Viet, viet hoa, thay khoang trang bang `-` va bo ky
  tu dac biet.
- Sequence co 4 chu so va bat dau tu `0001`.
- Extension goc duoc giu lai khi biet ten file.
- Nhieu anh duoc chon se tang sequence `0001`, `0002`, `0003`.
- Suggested Drive Path hien thi kem Suggested Filename.

## An toan du lieu

Ban cap nhat nay chi thay doi phan goi y ten file trong editor. Khong thay doi
IndexedDB schema, JSON/ZIP backup, import, export, manifest, checksum, Restore
Preview, Future Letters hoac Media Upload Queue.
