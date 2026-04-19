/**
 * "Nasıl Oynanır?" modalındaki tek bir kural maddesi için props.
 */
interface RuleItemProps {
  iconBg: string;
  iconColor: string;
  icon: React.ReactNode;
  children: React.ReactNode;
}

/**
 * Tek bir kural maddesi bileşeni. İkon ve açıklama metni içerir.
 */
function RuleItem({ iconBg, iconColor, icon, children }: RuleItemProps) {
  return (
    <li className="flex items-start gap-3">
      <div className={`flex-shrink-0 ${iconBg} ${iconColor} p-2 rounded-xl`}>
        {icon}
      </div>
      <p className="text-slate-600 text-sm leading-snug pt-0.5">{children}</p>
    </li>
  );
}

/**
 * Oyun kurallarının gösterildiği içerik bileşeni.
 * Ayarlar modalı ve giriş ekranındaki "Nasıl Oynanır?" modalında kullanılır.
 * Kod tekrarını önlemek için tek bir kaynak olarak oluşturulmuştur.
 */
export function HowToPlayContent() {
  return (
    <ul className="space-y-4">
      <RuleItem
        iconBg="bg-violet-100"
        iconColor="text-violet-600"
        icon={
          <svg xmlns="http://www.w3.org/2000/svg" width="18" height="18" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round">
            <circle cx="12" cy="12" r="10"/>
            <circle cx="12" cy="12" r="6"/>
            <circle cx="12" cy="12" r="2"/>
          </svg>
        }
      >
        <strong className="text-slate-800">14 Soru:</strong> 4 harfliden 10 harfliye kadar her harf grubundan 2&apos;şer soru sorulur.
      </RuleItem>

      <RuleItem
        iconBg="bg-amber-100"
        iconColor="text-amber-600"
        icon={
          <svg xmlns="http://www.w3.org/2000/svg" width="18" height="18" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round">
            <circle cx="12" cy="12" r="10"/>
            <polyline points="12 6 12 12 16 14"/>
          </svg>
        }
      >
        Tüm oyunu tamamlamak için <strong className="text-amber-600">toplam süreniz 4 dakikadır</strong>.
      </RuleItem>

      <RuleItem
        iconBg="bg-blue-100"
        iconColor="text-blue-600"
        icon={
          <svg xmlns="http://www.w3.org/2000/svg" width="18" height="18" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round">
            <path d="M15 14c.2-1 .7-1.7 1.5-2.5 1-.9 1.5-2.2 1.5-3.5A6 6 0 0 0 6 8c0 1 .2 2.2 1.5 3.5.7.9 1.2 1.5 1.5 2.5"/>
            <path d="M9 18h6"/>
            <path d="M10 22h4"/>
          </svg>
        }
      >
        Her harfin puan değeri <strong className="text-blue-600">100&apos;dir</strong>. <strong className="text-slate-800">&quot;Harf Al&quot;</strong> butonuna bastıkça kelimeden alabileceğiniz toplam puandan <strong className="text-red-500">100 düşer</strong>.
      </RuleItem>

      <RuleItem
        iconBg="bg-emerald-100"
        iconColor="text-emerald-600"
        icon={
          <svg xmlns="http://www.w3.org/2000/svg" width="18" height="18" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round">
            <rect width="20" height="16" x="2" y="4" rx="2" ry="2"/>
            <path d="M6 8h.01"/>
            <path d="M10 8h.01"/>
            <path d="M14 8h.01"/>
            <path d="M18 8h.01"/>
            <path d="M8 12h.01"/>
            <path d="M12 12h.01"/>
            <path d="M16 12h.01"/>
            <path d="M7 16h10"/>
          </svg>
        }
      >
        <strong className="text-slate-800">&quot;Cevapla&quot;</strong> dedikten sonra ana süre durur, <strong className="text-emerald-600">30 saniyelik cevaplama süreniz</strong> başlar.
      </RuleItem>

      <RuleItem
        iconBg="bg-red-100"
        iconColor="text-red-600"
        icon={
          <svg xmlns="http://www.w3.org/2000/svg" width="18" height="18" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round">
            <circle cx="12" cy="12" r="10"/>
            <line x1="12" y1="8" x2="12" y2="12"/>
            <line x1="12" y1="16" x2="12.01" y2="16"/>
          </svg>
        }
      >
        <strong className="text-slate-800">Dikkat:</strong> Cevaplama süreniz biterse, o an alınabilecek puan <strong className="text-red-600">eksi puan (-)</strong> olarak hanenize yansır.
      </RuleItem>
    </ul>
  );
}
