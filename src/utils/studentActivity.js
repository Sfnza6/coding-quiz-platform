export function verdictLabel(verdict) {
  switch (verdict) {
    case "accepted": return "مقبول";
    case "wrong_answer": return "إجابة خاطئة";
    case "compile_error": return "خطأ في الترجمة";
    case "runtime_error": return "خطأ أثناء التشغيل";
    case "judge_error": return "تعذر التقييم";
    default: return "قيد التقييم";
  }
}

export function formatStudentDate(value, locale = "ar") {
  if (!value) return "—";
  const date = new Date(String(value).replace(" ", "T"));
  if (Number.isNaN(date.getTime())) return value;
  return new Intl.DateTimeFormat(locale === "ar" ? "ar-LY" : "en-GB", {
    dateStyle: "medium",
    timeStyle: "short",
  }).format(date);
}
