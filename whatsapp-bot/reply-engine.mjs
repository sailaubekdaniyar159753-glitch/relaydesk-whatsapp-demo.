// DenSai WhatsApp bot: isolated, dependency-free routing logic.
// No personal data or message history is persisted by this module.
const normalize = (value) => String(value ?? "").trim().toLowerCase().replace(/\s+/g, " ");
const has = (text, words) => words.some((word) => text.includes(word));
export function classifyMessage(message) {
  const text = normalize(message);
  if (!text) return "empty";
  if (has(text, ["стоп", "отпис", "stop", "unsubscribe"])) return "opt_out";
  if (has(text, ["сотрудник", "работник", "ваканс", "резюме", "работу", "job", "employment"])) return "worker";
  if (has(text, ["заказ", "стоим", "цен", "сколько", "бот", "ролик", "монтаж", "сайт", "реклам", "услуг", "buy", "price"])) return "client";
  return "unknown";
}
const replies = {
  empty: "Напишите ваш вопрос, и мы постараемся помочь.",
  opt_out: "Хорошо. Мы не будем отправлять вам инициативные сообщения. Чтобы возобновить общение, напишите нам сами.",
  worker: "Здравствуйте! Вы обращаетесь по поводу работы? Напишите, какую работу вы ищете и какой опыт у вас есть. Лишние личные данные пока не присылайте.",
  client: "Здравствуйте! Это DenSai Studio. Расскажите, что хотите заказать, примерный срок и задачу. Мы уточним детали и стоимость.",
  unknown: "Здравствуйте! Вы обратились в DenSai Studio. Вам нужны наши услуги или вы интересуетесь работой? Напишите подробнее."
};
export function buildReply(message) {
  const category = classifyMessage(message);
  return { category, text: replies[category], needsHuman: category === "unknown" || category === "opt_out" };
}
