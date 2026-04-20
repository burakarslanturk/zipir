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
 */
export function VirtualKeyboard({ onKeyPress, onBackspace, onSubmit }: VirtualKeyboardProps) {
  // Türkçe Q klavye dizilimi (3 satır)
  const rows = [
    ["Q", "W", "E", "R", "T", "Y", "U", "I", "O", "P", "Ğ", "Ü"],
    ["A", "S", "D", "F", "G", "H", "J", "K", "L", "Ş", "İ"],
    ["Z", "X", "C", "V", "B", "N", "M", "Ö", "Ç"]
  ];

  return (
    <div className="fixed bottom-0 left-0 right-0 w-full bg-[var(--slate-200)]/95 backdrop-blur-md p-2 pb-8 sm:hidden z-50 animate-in slide-in-from-bottom border-t border-[var(--slate-300)] shadow-[0_-10px_30px_rgba(0,0,0,0.1)]">
      <div className="flex flex-col gap-2 max-w-lg mx-auto">
        {rows.map((row, rowIndex) => (
          <div key={rowIndex} className="flex justify-center gap-1.5">
            {rowIndex === 2 && (
              <button
                type="button"
                onClick={(e) => { e.preventDefault(); onBackspace(); }}
                className="flex-[1.5] bg-[var(--slate-400)] text-[var(--text-inverse)] font-bold rounded-lg py-3.5 px-2 text-xs active:scale-95 transition-transform flex items-center justify-center shadow-sm"
              >
                SİL
              </button>
            )}
            
            {row.map((key) => (
              <button
                key={key}
                type="button"
                onClick={(e) => { e.preventDefault(); onKeyPress(key); }}
                className="flex-1 bg-[var(--bg-primary)] text-[var(--violet-700)] font-bold text-sm rounded-lg py-3.5 shadow-sm active:scale-95 active:bg-[var(--violet-100)] active:text-[var(--violet-800)] transition-all flex items-center justify-center border border-[var(--slate-100)]"
              >
                {key}
              </button>
            ))}

            {rowIndex === 2 && (
              <button
                type="button"
                onClick={(e) => { e.preventDefault(); onSubmit(); }}
                className="flex-[2] bg-[var(--violet-600)] text-[var(--text-inverse)] font-bold rounded-lg py-3.5 px-2 text-xs active:scale-95 transition-transform shadow-md flex items-center justify-center"
              >
                GÖNDER
              </button>
            )}
          </div>
        ))}
      </div>
    </div>
  );
}
