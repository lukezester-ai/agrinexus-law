"use client";

import { useState } from "react";
import { SitePageShell } from "@/components/site-page-shell";
import { FileText, Download, Printer, Copy, Check, ChevronDown, ChevronUp } from "lucide-react";

const TEMPLATES = [
	{
		id: "lease",
		title: "Договор за аренда на земеделска земя",
		desc: "Типов договор между арендодател и арендатор за временно ползване на земеделски имот.",
		content: `ДОГОВОР ЗА АРЕНДА НА ЗЕМЕДЕЛСКА ЗЕМЯ

Днес, ______________ г., в град ______________,

между:

1. ___________________________, ЕИК: _______________, адрес: ___________________________,
наричан/а за краткост „АРЕНДОДАТЕЛ"

и

2. ___________________________, ЕИК: _______________, адрес: ___________________________,
представлявано от ___________________________, наричано за краткост „АРЕНДАТОР"

на основание чл. 37, ал. 1 от Закона за собствеността и земеделската земя, се сключи настоящият договор за:

I. ПРЕДМЕТ НА ДОГОВОРА
1.1. Арендодателят предоставя, а Арендаторът приема за временно и възмездно ползване следния имот:
- Земеделска земя в местност: ___________________________
- Площ: ______________ дка
- Кадастрален номер: ___________________________

II. СРОК
2.1. Договорът се сключва за срок от ______________ години, считано от ______________ г.

III. АРЕНДНО ПЛАЩАНЕ
3.1. Годишното арендно плащане е в размер на ______________ лв.

IV. ПРАВА И ЗАДЪЛЖЕНИЯ
4.1. Арендаторът има право да обработва земята и да прибира продукцията.
4.2. Арендаторът заплаща дължимите данъци и такси за имота.

V. ПРЕКРАТЯВАНЕ
5.1. Договорът се прекратява с изтичане на срока, по взаимно съгласие или при неизпълнение.

Настоящият договор се състави в два еднообразни екземпляра – по един за всяка от страните.

АРЕНДОДАТЕЛ: ____________________
АРЕНДАТОР: ______________________`,
	},
	{
		id: "machine_rental",
		title: "Договор за наем на земеделска машина",
		desc: "Типов договор за временно ползване на трактор, комбайн или друга земеделска техника.",
		content: `ДОГОВОР ЗА НАЕМ НА ЗЕМЕДЕЛСКА МАШИНА

Днес, ______________ г.,

между:

1. ___________________________, ЕИК: _______________, адрес: ___________________________,
наричан/а „НАЕМОДАТЕЛ"

и

2. ___________________________, ЕИК: _______________, адрес: ___________________________,
наричан/а „НАЕМАТЕЛ"

I. ПРЕДМЕТ
1.1. Наемодателят предоставя на Наемателя за временно ползване следната машина:
- Тип: ___________________________
- Марка/модел: ___________________________
- Рег. номер: ___________________________

II. СРОК И ЦЕНА
2.1. Срок на наема: ______________ дни/месеца.
2.2. Наемна цена: ______________ лв.

III. ЗАДЪЛЖЕНИЯ
3.1. Наемателят отговаря за горивото и оператора.
3.2. Наемателят носи отговорност за повреди, причинени по негово вино.

НАЕМОДАТЕЛ: ____________________
НАЕМАТЕЛ: ______________________`,
	},
	{
		id: "sale",
		title: "Договор за покупко-продажба на продукция",
		desc: "Типов договор между производител и купувач за продажба на земеделска продукция.",
		content: `ДОГОВОР ЗА ПОКУПКО-ПРОДАЖБА НА ЗЕМЕДЕЛСКА ПРОДУКЦИЯ

Днес, ______________ г.,

между:

1. ___________________________, ЕИК: _______________, адрес: ___________________________,
наричан/а „ПРОДАВАЧ"

и

2. ___________________________, ЕИК: _______________, адрес: ___________________________,
наричан/а „КУПУВАЧ"

I. ПРЕДМЕТ
1.1. Продавачът продава, а Купувачът купува следната продукция:
- Продукт: ___________________________
- Количество: ______________ ______________
- Цена: ______________ лв/бр.
- Обща стойност: ______________ лв.

II. ПЛАЩАНЕ
2.1. Плащането се извършва по банков път в срок до ______________ дни.

III. ПРЕДАВАНЕ
3.1. Продукцията се предава на място: ___________________________ на дата ______________ г.

ПРОДАВАЧ: ____________________
КУПУВАЧ: ____________________`,
	},
	{
		id: "service",
		title: "Договор за земеделска услуга",
		desc: "Типов договор за извършване на земеделски услуги – оран, сеитба, пръскане, прибиране на реколта.",
		content: `ДОГОВОР ЗА ЗЕМЕДЕЛСКА УСЛУГА

Днес, ______________ г.,

между:

1. ___________________________, ЕИК: _______________, адрес: ___________________________,
наричан/а „ВЪЗЛОЖИТЕЛ"

и

2. ___________________________, ЕИК: _______________, адрес: ___________________________,
наричан/а „ИЗПЪЛНИТЕЛ"

I. ПРЕДМЕТ
1.1. Изпълнителят се задължава да извърши следната услуга:
- Вид услуга: ___________________________
- Площ/обем: ______________
- Период: ___________________________

II. ЦЕНА И ПЛАЩАНЕ
2.1. Цена: ______________ лв.
2.2. Плащане: ______________

III. ОТГОВОРНОСТ
3.1. Изпълнителят носи отговорност за качественото изпълнение на услугата.

ВЪЗЛОЖИТЕЛ: ____________________
ИЗПЪЛНИТЕЛ: ____________________`,
	},
	{
		id: "pesticide_diary",
		title: "Дневник за растителна защита",
		desc: "БАБХ дневник за прилагане на продукти за растителна защита – копие за полеви запис.",
		content: `ДНЕВНИК ЗА РАСТИТЕЛНА ЗАЩИТА

Земеделски производител: ___________________________
Парцел/поле: ___________________________
Култура: ___________________________
Площ: ______________ дка

----- ЗАПИС № 1 -----
Дата: ______________
Препарат: ___________________________
Количество: ______________
Време: ______________
Подпис: ______________

----- ЗАПИС № 2 -----
Дата: ______________
Препарат: ___________________________
Количество: ______________
Време: ______________
Подпис: ______________

----- ЗАПИС № 3 -----
Дата: ______________
Препарат: ___________________________
Количество: ______________
Време: ______________
Подпис: ______________`,
	},
	{
		id: "writeoff",
		title: "Протокол за бракуване на активи",
		desc: "Протокол за изписване и бракуване на дълготрайни материални активи, инвентар или продукция.",
		content: `ПРОТОКОЛ ЗА БРАКУВАНЕ № _______

Днес, ______________ г.

Комисия в състав:
1. ___________________________
2. ___________________________
3. ___________________________

назначена със заповед № _______ от ______________ г., извърши оглед на:

Актив №: ______________
Наименование: ___________________________
Инвентарен номер: ______________
Година на производство: ______________

Причина за бракуване:
□ Физическо износване
□ Морално остаряване
□ Повреда/авария
□ Друга: ___________________________

Заключение на комисията: ___________________________

Подписи:
1. ___________________
2. ___________________
3. ___________________`,
	},
];

function downloadTxt(content: string, filename: string) {
	const blob = new Blob([content], { type: "text/plain;charset=utf-8" });
	const url = URL.createObjectURL(blob);
	const a = document.createElement("a");
	a.href = url;
	a.download = filename;
	a.click();
	URL.revokeObjectURL(url);
}

export default function ObrazciPage() {
	const [openId, setOpenId] = useState<string | null>(null);
	const [copiedId, setCopiedId] = useState<string | null>(null);

	const handleCopy = async (id: string, content: string) => {
		await navigator.clipboard.writeText(content);
		setCopiedId(id);
		setTimeout(() => setCopiedId(null), 2000);
	};

	return (
		<SitePageShell maxWidth="4xl" subheader={<p className="text-sm font-bold text-emerald-700 dark:text-emerald-400">Образци и бланки на договори</p>}>
			<div className="mb-10 text-center">
				<div className="mx-auto mb-4 flex h-20 w-20 items-center justify-center rounded-3xl bg-gradient-to-tr from-emerald-600 via-teal-500 to-fuchsia-600 text-white shadow-lg shadow-emerald-500/25 animate-float">
					<FileText size={36} />
				</div>
				<h1 className="text-3xl sm:text-4xl font-extrabold tracking-tight text-transparent bg-clip-text bg-gradient-to-r from-emerald-600 via-teal-500 to-fuchsia-600">
					Образци на документи и договори
				</h1>
				<p className="mx-auto mt-2.5 max-w-2xl text-sm sm:text-base font-medium leading-relaxed text-slate-600 dark:text-slate-300">
					Изтеглете, копирайте и попълнете готови типови шаблони — договори за аренда, наем на техника и дневници за земеделското стопанство.
				</p>
			</div>

			<div className="space-y-6">
				{TEMPLATES.map((tpl) => {
					const isOpen = openId === tpl.id;
					return (
						<div key={tpl.id} className="card-hover-pro glass-panel-pro rounded-[32px] border border-slate-200/90 dark:border-slate-800 bg-white/95 dark:bg-slate-950/80 p-6 sm:p-8 shadow-[0_24px_60px_-15px_rgba(16,185,129,0.15)] transition-all duration-300 hover:border-emerald-400/60 backdrop-blur-2xl">
							<div className="flex flex-col sm:flex-row sm:items-start justify-between gap-6">
								<div className="min-w-0 flex-1">
									<div className="inline-flex items-center gap-2 rounded-full bg-emerald-500/10 border border-emerald-500/25 px-3 py-1 text-[11px] font-extrabold uppercase tracking-wider text-emerald-600 dark:text-emerald-400 mb-3">
										<span>Готов шаблон за ползване</span>
									</div>
									<h3 className="text-xl font-extrabold text-slate-900 dark:text-white tracking-tight">{tpl.title}</h3>
									<p className="mt-1.5 text-sm font-medium leading-relaxed text-slate-600 dark:text-slate-400">{tpl.desc}</p>
								</div>
								<div className="flex flex-wrap items-center gap-2.5 shrink-0">
									<button
										onClick={() => downloadTxt(tpl.content, `${tpl.id}.txt`)}
										className="inline-flex items-center gap-1.5 rounded-xl bg-gradient-to-r from-emerald-600 to-teal-600 px-4 py-2.5 text-xs font-extrabold text-white hover:brightness-110 shadow-md shadow-emerald-500/20 transition-all active:scale-95"
									>
										<Download size={15} /> Изтегли
									</button>
									<button
										onClick={() => handleCopy(tpl.id, tpl.content)}
										className="inline-flex items-center gap-1.5 rounded-xl border border-slate-300/90 bg-slate-50/80 px-4 py-2.5 text-xs font-extrabold text-slate-800 hover:border-emerald-500 hover:text-emerald-600 dark:border-slate-700 dark:bg-slate-900/80 dark:text-slate-200 dark:hover:text-emerald-400 transition-all shadow-sm active:scale-95"
									>
										{copiedId === tpl.id ? <Check size={15} className="text-emerald-500" /> : <Copy size={15} />}
										{copiedId === tpl.id ? "Копиран!" : "Копирай"}
									</button>
									<button
										onClick={() => window.print()}
										className="inline-flex items-center gap-1.5 rounded-xl border border-slate-300/90 bg-slate-50/80 px-3.5 py-2.5 text-xs font-extrabold text-slate-800 hover:border-emerald-500 hover:text-emerald-600 dark:border-slate-700 dark:bg-slate-900/80 dark:text-slate-200 dark:hover:text-emerald-400 transition-all shadow-sm"
										title="Разпечатай"
									>
										<Printer size={15} />
									</button>
									<button
										onClick={() => setOpenId(isOpen ? null : tpl.id)}
										className="inline-flex items-center gap-1.5 rounded-xl border border-slate-300/90 bg-slate-50/80 px-3.5 py-2.5 text-xs font-extrabold text-slate-800 hover:border-emerald-500 hover:text-emerald-600 dark:border-slate-700 dark:bg-slate-900/80 dark:text-slate-200 dark:hover:text-emerald-400 transition-all shadow-sm"
										title={isOpen ? "Скрий текста" : "Покажи текста"}
									>
										{isOpen ? <ChevronUp size={15} /> : <ChevronDown size={15} />}
									</button>
								</div>
							</div>
							{isOpen && (
								<div className="mt-6 pt-6 border-t border-slate-200/80 dark:border-slate-800 animate-fadeIn">
									<pre className="whitespace-pre-wrap rounded-2xl border border-slate-200/90 bg-slate-50/90 p-5 font-mono text-xs sm:text-sm leading-relaxed text-slate-800 dark:border-slate-800 dark:bg-slate-950/90 dark:text-slate-300 overflow-x-auto shadow-inner">
										{tpl.content}
									</pre>
								</div>
							)}
						</div>
					);
				})}
			</div>

			<p className="mt-10 text-center text-xs font-semibold text-slate-400 dark:text-slate-500 leading-relaxed">
				⚠️ Шаблоните са примерни и не представляват индивидуален правен съвет. Консултирайте се с юрист или агроконсултант преди подписване и регистрация.
			</p>
		</SitePageShell>
	);
}
