# KHOBAUKYUC V6.0 - Family Drive Workflow Release

## Muc tieu

V6.0 ho tro gia dinh luu anh/video goc tren Google Drive theo quy trinh thu
cong, trong khi KHOBAUKYUC tiep tuc la ung dung static, local-first va an toan
voi du lieu V5.6.

## Pham vi

- Drive Root Folder Link trong Cai dat.
- Suggested Filename va Suggested Drive Path trong editor.
- Link Google Drive anh goc, YouTube va Drive video trong Quick Add.
- Kiem tra link Google Drive va YouTube truoc khi luu.
- Media Coverage summary.
- Media Upload Queue.
- Family Drive Checklist.
- Thong bao Drive upload van la thao tac thu cong.

## Khong thay doi

- Khong co backend.
- Khong co OAuth.
- Khong co Drive sync hoac upload tu dong.
- Khong thay doi IndexedDB schema.
- Khong thay doi JSON/ZIP backup format.
- Khong thay doi manifest, checksum hoac Restore Preview.

## Quy trinh khuyen nghi

1. Upload anh/video goc len Google Drive bang thao tac thu cong.
2. Dung thu muc goc `KHOBAUKYUC` va chon dung giai doan tuoi.
3. Doi ten file theo Suggested Filename trong editor.
4. Dan link Drive/YouTube vao ky niem.
5. Kiem tra Media Upload Queue de bo sung link con thieu.
6. Export JSON sau dot nhap lieu va Export ZIP moi thang.
7. Luu anh/video goc va backup o it nhat hai noi.

## Nhac an toan

Du lieu tren cac dien thoai khong tu dong dong bo voi nhau. Khong xoa anh/video
goc sau khi da luu link, va khong coi IndexedDB la kho luu tru vinh vien.
