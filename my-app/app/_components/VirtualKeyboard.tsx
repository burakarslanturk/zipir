"use client";

/**
 * Sanal klavye bileşeni için props.
 */
interface VirtualKeyboardProps {
  /** Harf tuşuna basıldığında çağrılır */
  onKeyPress: (key: string) => void;
  /** Silme tuşuna basıldığında çağrılır */
  onBackspace: () => void;
  /** Gönder tuşuna basıldığında çağrılır */
  onSubmit: () => void;
}

/**
 * Mobil cihazlarda cevaplama aşamasında gösterilen sanal Türkçe klavye.
 * Ekranın altında sabit konumlanır ve sadece sm (640px) altı ekranlarda görünür.
 * Türkçe karakterleri (Ç, Ğ, İ, Ö, Ş, Ü) içerir.
 * iOS Türkçe QWERTY klavye düzenine göre tasarlanmıştır.
 */
export function VirtualKeyboard({ onKeyPress, onBackspace, onSubmit }: VirtualKeyboardProps) {
  // iOS Türkçe QWERTY klavye dizilimi
  const row1 = ["Q", "W", "E", "R", "T", "Y", "U", "I", "O", "P", "Ğ", "Ü"];
  const row2 = ["A", "S", "D", "F", "G", "H", "J", "K", "L", "Ş", "İ"];
  const row3 = ["Z", "X", "C", "V", "B", "N", "M", "Ö", "Ç"];

  // Standart harf tuşu stili - tüm harflerde eşit genişlik
  const keyClass = "w-[8.5%] bg-[var(--bg-primary)] text-[var(--violet-700)] font-bold text-base rounded-lg py-3 shadow-sm active:scale-95 active:bg-[var(--violet-100)] active:text-[var(--violet-800)] transition-all flex items-center justify-center border border-[var(--slate-100)]";

  return (
    <div className="fixed bottom-0 left-0 right-0 w-full bg-[var(--slate-200)]/95 backdrop-blur-md p-1.5 pb-8 sm:hidden z-50 animate-in slide-in-from-bottom border-t border-[var(--slate-300)] shadow-[0_-10px_30px_rgba(0,0,0,0.1)]">
      <div className="flex flex-col gap-1.5 max-w-lg mx-auto">
        {/* Satır 1: Q W E R T Y U I O P Ğ Ü */}
        <div className="flex justify-center gap-1">
          {row1.map((key) => (
            <button
              key={key}
              type="button"
              onClick={(e) => { e.preventDefault(); onKeyPress(key); }}
              className={keyClass}
            >
              {key}
            </button>
          ))}
        </div>

        {/* Satır 2: A S D F G H J K L Ş İ - Ortalanmış, yarım tuşluk padding her iki taraftan */}
        <div className="flex justify-center gap-1 px-[4.25%]">
          {row2.map((key) => (
            <button
              key={key}
              type="button"
              onClick={(e) => { e.preventDefault(); onKeyPress(key); }}
              className={keyClass}
            >
              {key}
            </button>
          ))}
        </div>

        {/* Satır 3: GÖNDER (sol), Z X C V B N M Ö Ç, SİL (sağ) */}
        <div className="flex justify-center gap-1">
          {/* GÖNDER butonu - iOS Shift tuşu konumunda (sol) */}
          <button
            type="button"
            onClick={(e) => { e.preventDefault(); onSubmit(); }}
            className="w-[12%] bg-[var(--violet-600)] text-[var(--text-inverse)] font-bold rounded-lg py-3 px-1 text-[10px] active:scale-95 transition-transform shadow-md flex items-center justify-center"
          >
            GÖNDER
          </button>

          {/* 9 harf tuşu */}
          {row3.map((key) => (
            <button
              key={key}
              type="button"
              onClick={(e) => { e.preventDefault(); onKeyPress(key); }}
              className={keyClass}
            >
              {key}
            </button>
          ))}

          {/* SİL butonu - iOS Backspace konumunda (sağ) */}
          <button
            type="button"
            onClick={(e) => { e.preventDefault(); onBackspace(); }}
            className="w-[12%] bg-[var(--slate-400)] text-[var(--text-inverse)] font-bold rounded-lg py-3 px-1 text-xs active:scale-95 transition-transform flex items-center justify-center shadow-sm"
          >
            <svg xmlns="http://www.w3.org/2000/svg" className="h-5 w-5" viewBox="0 0 20 20" fill="currentColor">
              <path fillRule="evenodd" d="M6.707 4.293a1 1 0 010 1.414L4.414 8H16a1 1 0 110 2H4.414l2.293 2.293a1 1 0 01-1.414 1.414l-4-4a1 1 0 010-1.414l4-4a1 1 0 011.414 0z" clipRule="evenodd" />
            </svg>
          </button>
        </div>
      </div>
    </div>
  );
}
