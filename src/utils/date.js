export function yymmddFromDate(value) {
  if (!value) return "";
  const [year, month, day] = value.split("-");
  return year.slice(-2) + month + day;
}

export function dateFromYYMMDD(code) {
  return /^\d{6}$/.test(code)
    ? `20${code.slice(0, 2)}-${code.slice(2, 4)}-${code.slice(4, 6)}`
    : "";
}

export function todayIso() {
  return new Date().toISOString().slice(0, 10);
}
