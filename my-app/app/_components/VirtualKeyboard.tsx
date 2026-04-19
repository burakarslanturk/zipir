"use client";

interface VirtualKeyboardProps {
  onKeyPress: (key: string) => void;
  onBackspace: () => void;
  onSubmit: () => void;
}

export function VirtualKeyboard({ onKeyPress, onBackspace, onSubmit }: VirtualKeyboardProps) {
  const rows = [
    ["Q", "W", "E", "R", "T", "Y", "U", "I", "O", "P", "Ğ", "Ü"],
    ["A", "S", "D", "F", "G", "H", "J", "K", "L", "Ş", "İ"],
    ["Z", "X", "C", "V", "B", "N", "M", "Ö", "Ç"]
  ];

  return (
    <div className="fixed bottom-0 left-0 right-0 w-full bg-slate-200/95 backdrop-blur-md p-2 pb-8 sm:hidden z-50 animate-in slide-in-from-bottom border-t border-slate-300 shadow-[0_-10px_30px_rgba(0,0,0,0.1)]">
      <div className="flex flex-col gap-2 max-w-lg mx-auto">
        {rows.map((row, rowIndex) => (
          <div key={rowIndex} className="flex justify-center gap-1.5">
            {rowIndex === 2 && (
              <button
                type="button"
                onClick={(e) => { e.preventDefault(); onBackspace(); }}
                className="flex-[1.5] bg-slate-400 text-white font-bold rounded-lg py-3.5 px-2 text-xs active:scale-95 transition-transform flex items-center justify-center shadow-sm"
              >
                SİL
              </button>
            )}
            
            {row.map((key) => (
              <button
                key={key}
                type="button"
                onClick={(e) => { e.preventDefault(); onKeyPress(key); }}
                className="flex-1 bg-white text-violet-700 font-bold text-sm rounded-lg py-3.5 shadow-sm active:scale-95 active:bg-violet-100 active:text-violet-800 transition-all flex items-center justify-center border border-slate-100"
              >
                {key}
              </button>
            ))}

            {rowIndex === 2 && (
              <button
                type="button"
                onClick={(e) => { e.preventDefault(); onSubmit(); }}
                className="flex-[2] bg-violet-600 text-white font-bold rounded-lg py-3.5 px-2 text-xs active:scale-95 transition-transform shadow-md flex items-center justify-center"
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
