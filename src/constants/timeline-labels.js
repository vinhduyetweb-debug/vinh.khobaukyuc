export const AGE_STAGE_LABELS = {
  "00_01_TUOI": "0-1 tuoi: Nhung ngay dau doi",
  "01_02_TUOI": "1-2 tuoi: Tap di, tap noi",
  "02_03_TUOI": "2-3 tuoi: Kham pha the gioi",
  "03_04_TUOI": "3-4 tuoi: Mam non yeu thuong",
  "04_05_TUOI": "4-5 tuoi: Nhung cau noi dang yeu",
  "05_06_TUOI": "5-6 tuoi: Chuan bi vao lop 1",
  "06_07_TUOI": "6-7 tuoi: Nam con vao lop 1",
  "07_08_TUOI": "7-8 tuoi: Lon hon moi ngay",
  "08_09_TUOI": "8-9 tuoi: Ban be va truong lop",
  "09_10_TUOI": "9-10 tuoi: Nhung uoc mo dau tien",
  "10_11_TUOI": "10-11 tuoi: Tu tin hon moi ngay",
  "11_12_TUOI": "11-12 tuoi: Sap thanh thieu nien",
  "12_13_TUOI": "12-13 tuoi: Dau moc moi cua con",
  "13_14_TUOI": "13-14 tuoi: Tuoi teen bat dau",
  "14_15_TUOI": "14-15 tuoi: Nhung dieu con yeu",
  "15_16_TUOI": "15-16 tuoi: Truong thanh va manh me",
  "16_17_TUOI": "16-17 tuoi: Gan hon voi tuong lai",
  "17_18_TUOI": "17-18 tuoi: Truoc ngay con thanh nguoi lon",
};

export function ageStageLabel(ageStage) {
  return AGE_STAGE_LABELS[ageStage] || ageStage || "";
}
