const commonNames = {
  محمد: "Mohammed", احمد: "Ahmed", أحمد: "Ahmed", محمود: "Mahmoud",
  علي: "Ali", عمر: "Omar", عثمان: "Othman", يوسف: "Yousef",
  ابراهيم: "Ibrahim", إبراهيم: "Ibrahim", خالد: "Khaled", عبدالله: "Abdullah",
  عبد: "Abd", عبدالرحمن: "Abdulrahman", عبداللّه: "Abdullah",
  عبدالهادي: "Abdulhadi", عبدالكريم: "Abdulkarim", حسين: "Hussein",
  حسن: "Hassan", سالم: "Salem", صالح: "Saleh", سعيد: "Saeed",
  فاطمة: "Fatima", عائشة: "Aisha", خديجة: "Khadija", مريم: "Mariam",
  سارة: "Sara", ساره: "Sara", نور: "Noor", هدى: "Huda",
  اسماء: "Asma", أسماء: "Asma", آية: "Aya", هند: "Hind",
  بن: "Bin", ابن: "Ibn",
};

const letters = {
  ا: "a", أ: "a", إ: "i", آ: "a", ب: "b", ت: "t", ث: "th",
  ج: "j", ح: "h", خ: "kh", د: "d", ذ: "dh", ر: "r", ز: "z",
  س: "s", ش: "sh", ص: "s", ض: "d", ط: "t", ظ: "z",
  ع: "a", غ: "gh", ف: "f", ق: "q", ك: "k", ل: "l",
  م: "m", ن: "n", ه: "h", ة: "a", و: "w", ي: "y", ى: "a",
  ء: "", ؤ: "w", ئ: "y", پ: "p", ڤ: "v", چ: "ch", گ: "g",
};

function latinWord(word) {
  if (commonNames[word]) return commonNames[word];
  const normalized = word.normalize("NFKD").replace(/[\u064B-\u065F\u0670\u0640]/g, "");
  if (commonNames[normalized]) return commonNames[normalized];
  if (/^[A-Za-z]+$/.test(normalized)) return normalized;
  const result = [...normalized].map((letter) => letters[letter] ?? "").join("");
  return result ? result[0].toUpperCase() + result.slice(1) : "";
}

export function suggestEnglishName(name) {
  return String(name || "")
    .trim()
    .split(/\s+/)
    .map(latinWord)
    .filter(Boolean)
    .join(" ");
}

export function isEnglishName(name) {
  const value = String(name || "").trim();
  return value.length > 0 && value.length <= 120 && /^[A-Za-z][A-Za-z .'-]*$/.test(value);
}
