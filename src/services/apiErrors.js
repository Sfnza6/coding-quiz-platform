const messages = {
  "Invalid credentials": "رقم القيد أو كلمة المرور غير صحيحة. تحقق من بيانات الدخول.",
  "Missing credentials": "أدخل رقم القيد وكلمة المرور.",
  "Missing student data": "أدخل اسم الطالب ورقم القيد.",
  "Student already exists": "رقم القيد موجود مسبقًا. استخدم حساب الطالب الموجود أو أدخل رقمًا مختلفًا.",
  "Unauthorized": "جلسة الدخول غير صالحة أو انتهت. سجّل الدخول من جديد.",
  "No active competition": "لا توجد مسابقة متاحة الآن. انتظر تفعيل المسابقة.",
  "Competition already finalized": "انتهت مشاركتك في هذه المسابقة ولا يمكن إرسال حلول جديدة.",
  "DB connection failed": "تعذر الاتصال بقاعدة البيانات. يرجى من المسؤول التحقق من تشغيلها.",
};
export function userError(error, fallback = "تعذر تنفيذ العملية. حاول مرة أخرى.") {
  if (error?.userMessage) return error.userMessage;
  const message = error?.data?.message || error?.message;
  if (messages[message]) return messages[message];
  if (error instanceof TypeError || /Failed to fetch|NetworkError|Load failed/i.test(message || "")) return "تعذر الاتصال بالخادم. تحقق من اتصال الشبكة وتشغيل الخدمة ثم حاول مجددًا.";
  return fallback;
}
export async function readApiResponse(response) {
  let data;
  try { data = await response.json(); } catch {
    const error = new Error("Invalid response");
    error.status = response.status;
    error.userMessage = response.status >= 500 ? "حدث خلل في الخادم أثناء تنفيذ الطلب. حاول لاحقًا أو تواصل مع المسؤول." : "وصل رد غير صالح من الخدمة. يرجى من المسؤول التحقق من إعدادات الخادم.";
    throw error;
  }
  if (!response.ok || data?.status === "error") {
    const error = new Error("Request failed");
    error.status = response.status;
    error.data = data;
    const defaults = {401: "بيانات الدخول غير صحيحة أو انتهت الجلسة. سجّل الدخول مجددًا.", 403: "لا يُسمح بتنفيذ هذه العملية في الحالة الحالية للمسابقة.", 404: "العنصر المطلوب غير موجود أو تم حذفه.", 409: "البيانات موجودة مسبقًا أو تتعارض مع الحالة الحالية.", 422: "بعض البيانات المطلوبة ناقصة أو غير صحيحة. راجع الحقول ثم حاول مجددًا.", 429: "طلبات كثيرة خلال وقت قصير. انتظر قليلًا ثم حاول مجددًا."};
    error.userMessage = messages[data?.message] || defaults[response.status] || (response.status >= 500 ? "حدث خلل في الخادم. حاول لاحقًا أو تواصل مع المسؤول." : "تعذر تنفيذ الطلب. راجع البيانات وحاول مجددًا.");
    throw error;
  }
  return data;
}
