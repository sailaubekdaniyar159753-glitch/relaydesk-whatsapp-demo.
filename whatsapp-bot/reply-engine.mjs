// Personnel Elite: inbound routing for household staffing service.
// Independent module. No production deployment, storage or outbound messages.
const norm = x => String(x ?? "").trim().toLowerCase().replace(/\s+/g," ");
export function classifyMessage(message){
 const t=norm(message);
 if(!t)return "empty";
 if(/(^|\s)(стоп|stop)(\s|$)|отпис/.test(t))return "opt_out";
 if(/ищу работу|хочу работать|устроиться|ваканси|соискател|резюме|ищу ваканс|работниц|работником/.test(t))return "worker";
 if(/ищу нян|нужна нян|нужен персонал|нужна домработ|требуется домработ|подобрать|нанять|заказ|услуг|цен|стоим|сколько|персонал/.test(t))return "client";
 return "unknown";
}
const replies={
 empty:"Здравствуйте! Вы обратились в «Персонал Элит». Напишите, нужен ли вам домашний персонал или вы ищете работу.",
 opt_out:"Принято. Не будем отправлять вам инициативные сообщения. При необходимости напишите нам снова.",
 worker:"Здравствуйте! Вы обратились в «Персонал Элит». Какую работу вы ищете: няня, домработница или другую? Укажите опыт, подходящий график, район и ожидаемую оплату. Паспорт и другие документы пока не отправляйте.",
 client:"Здравствуйте! «Персонал Элит» поможет с подбором домашнего персонала. Кого ищете (няню, домработницу или другого специалиста), в каком районе, на какой график и с каким бюджетом? Мы передадим заявку менеджеру.",
 unknown:"Здравствуйте! Это «Персонал Элит». Вам нужен домашний персонал или вы хотите устроиться на работу?"
};
export function buildReply(message){
 const category=classifyMessage(message);
 return {category,text:replies[category],needsHuman:category==="unknown"||category==="opt_out"};
}
