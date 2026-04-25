"use client";

import { useState } from "react";
import { useTheme } from "next-themes";

/**
 * Ayarlar modalı bileşeni için props.
 */
interface SettingsModalProps {
  /** Modal açık mı? */
  isOpen: boolean;
  /** Modal kapatıldığında çağrılır */
  onClose: () => void;
  /** Ses efektleri açık mı? */
  isSoundEnabled: boolean;
  /** Ses toggle değiştiğinde çağrılır */
  onSoundToggle: () => void;
  /** Sistem (native) klavye kullanılsın mı? */
  useNativeKeyboard: boolean;
  /** Klavye toggle değiştiğinde çağrılır */
  onNativeKeyboardToggle: () => void;
}

/**
 * Oyun ayarlarının gösterildiği modal bileşeni.
 * Minimal liste yapısı: Nasıl Oynanır?, Koyu tema, Ses efektleri, Bize ulaşın.
 */
export function SettingsModal({ 
  isOpen, 
  onClose, 
  isSoundEnabled, 
  onSoundToggle,
  useNativeKeyboard,
  onNativeKeyboardToggle
}: SettingsModalProps) {
  // Accordion state'leri
  const [isContactOpen, setIsContactOpen] = useState(false);
  
  // Tema hook'u
  const { theme, setTheme } = useTheme();

  // Modal kapalıysa render etme
  if (!isOpen) return null;

  return (
    <div 
      className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-[var(--overlay)] backdrop-blur-sm" 
      onClick={onClose}
    >
      <div
        className="bg-[var(--card)] rounded-2xl w-full max-w-md shadow-xl border border-[var(--card-border)] relative max-h-[90vh] overflow-y-auto"
        onClick={(e) => e.stopPropagation()}
      >
        {/* Modal Başlık */}
        <div className="flex items-center justify-between px-6 pt-6 pb-4 border-b border-[var(--card-border)]">
          <h3 className="text-xl font-black text-[var(--text-primary)]">Ayarlar</h3>
          <button
            onClick={onClose}
            className="p-1.5 rounded-lg text-[var(--slate-400)] hover:text-[var(--slate-600)] hover:bg-[var(--slate-100)] active:scale-95 transition-all"
            aria-label="Kapat"
          >
            <svg xmlns="http://www.w3.org/2000/svg" width="20" height="20" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2.5" strokeLinecap="round" strokeLinejoin="round">
              <line x1="18" y1="6" x2="6" y2="18"/>
              <line x1="6" y1="6" x2="18" y2="18"/>
            </svg>
          </button>
        </div>

        {/* İçerik */}
        <div className="py-2">
          
          {/* Ayarlar Listesi */}
          <div className="divide-y divide-[var(--card-border)]">
            
            {/* Koyu Tema Toggle */}
            <button
              onClick={() => setTheme(theme === "dark" ? "light" : "dark")}
              className="w-full flex items-center justify-between px-6 py-4 hover:bg-[var(--slate-50)] transition-colors"
            >
              <div className="flex items-center gap-3">
                <svg xmlns="http://www.w3.org/2000/svg" width="18" height="18" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round" className="text-[var(--slate-400)]">
                  <circle cx="12" cy="12" r="5"/>
                  <path d="M12 1v2"/>
                  <path d="M12 21v2"/>
                  <path d="M4.22 4.22l1.42 1.42"/>
                  <path d="M18.36 18.36l1.42 1.42"/>
                  <path d="M1 12h2"/>
                  <path d="M21 12h2"/>
                  <path d="M4.22 19.78l1.42-1.42"/>
                  <path d="M18.36 5.64l1.42-1.42"/>
                </svg>
                <span className="text-[var(--text-primary)]">Koyu tema</span>
              </div>
              <div
                className={`relative w-11 h-6 rounded-full transition-colors duration-200 ${theme === "dark" ? "bg-[var(--violet-500)]" : "bg-[var(--slate-300)]"}`}
              >
                <span className={`absolute top-0.5 left-0.5 w-5 h-5 bg-white rounded-full shadow-sm transition-transform duration-200 ${theme === "dark" ? "translate-x-5" : "translate-x-0"}`} />
              </div>
            </button>

            {/* Ses Efektleri Toggle */}
            <button
              onClick={onSoundToggle}
              className="w-full flex items-center justify-between px-6 py-4 hover:bg-[var(--slate-50)] transition-colors"
            >
              <div className="flex items-center gap-3">
                <svg xmlns="http://www.w3.org/2000/svg" width="18" height="18" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round" className="text-[var(--slate-400)]">
                  <polygon points="11 5 6 9 2 9 2 15 6 15 11 19 11 5"/>
                </svg>
                <span className="text-[var(--text-primary)]">Ses efektleri</span>
              </div>
              <div
                className={`relative w-11 h-6 rounded-full transition-colors duration-200 ${isSoundEnabled ? "bg-[var(--violet-500)]" : "bg-[var(--slate-300)]"}`}
              >
                <span className={`absolute top-0.5 left-0.5 w-5 h-5 bg-white rounded-full shadow-sm transition-transform duration-200 ${isSoundEnabled ? "translate-x-5" : "translate-x-0"}`} />
              </div>
            </button>

            {/* Klavye Türü Toggle */}
            <button
              onClick={onNativeKeyboardToggle}
              className="w-full flex items-center justify-between px-6 py-4 hover:bg-[var(--slate-50)] transition-colors"
            >
              <div className="flex items-center gap-3">
                <svg xmlns="http://www.w3.org/2000/svg" width="18" height="18" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round" className="text-[var(--slate-400)]">
                  <rect width="20" height="14" x="2" y="5" rx="2"/>
                  <path d="M6 8h.01M10 8h.01M14 8h.01M18 8h.01M8 12h.01M12 12h.01M16 12h.01M7 16h10"/>
                </svg>
                <div className="flex flex-col items-start">
                  <span className="text-[var(--text-primary)]">Sistem klavyesi</span>
                  <span className="text-[var(--text-muted)] text-xs">Telefon klavyesini kullan</span>
                </div>
              </div>
              <div
                className={`relative w-11 h-6 rounded-full transition-colors duration-200 ${useNativeKeyboard ? "bg-[var(--violet-500)]" : "bg-[var(--slate-300)]"}`}
              >
                <span className={`absolute top-0.5 left-0.5 w-5 h-5 bg-white rounded-full shadow-sm transition-transform duration-200 ${useNativeKeyboard ? "translate-x-5" : "translate-x-0"}`} />
              </div>
            </button>

            {/* Bize Ulaşın - Accordion */}
            <div className="overflow-hidden">
              <button
                onClick={() => setIsContactOpen(!isContactOpen)}
                className="w-full flex items-center justify-between px-6 py-4 hover:bg-[var(--slate-50)] transition-colors"
              >
                <div className="flex items-center gap-3">
                  <svg xmlns="http://www.w3.org/2000/svg" width="18" height="18" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round" className="text-[var(--slate-400)]">
                    <path d="M21 15a2 2 0 0 1-2 2H7l-4 4V5a2 2 0 0 1 2-2h14a2 2 0 0 1 2 2z"/>
                  </svg>
                  <span className="text-[var(--text-primary)]">Bize ulaşın</span>
                </div>
                <svg 
                  xmlns="http://www.w3.org/2000/svg" 
                  width="18" 
                  height="18" 
                  viewBox="0 0 24 24" 
                  fill="none" 
                  stroke="currentColor" 
                  strokeWidth="2" 
                  strokeLinecap="round" 
                  strokeLinejoin="round"
                  className={`text-[var(--slate-400)] transition-transform duration-200 ${isContactOpen ? "rotate-90" : ""}`}
                >
                  <polyline points="9 18 15 12 9 6"/>
                </svg>
              </button>
              {isContactOpen && (
                <div className="px-6 pt-3 pb-5 border-t border-[var(--card-border)]">
                  <p className="text-[var(--text-secondary)] text-sm mb-3 pt-1">
                    Sorularınız, önerileriniz veya geri bildirimleriniz için bize ulaşabilirsiniz.
                  </p>
                  <a
                    href="mailto:iletisim@zipir.com"
                    className="flex items-center gap-2 p-3 rounded-xl bg-[var(--blue-50)] text-[var(--blue-600)] hover:bg-[var(--blue-100)] transition-colors text-sm"
                  >
                    <svg xmlns="http://www.w3.org/2000/svg" width="16" height="16" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round">
                      <rect width="20" height="16" x="2" y="4" rx="2"/>
                      <path d="m22 7-8.97 5.7a1.94 1.94 0 0 1-2.06 0L2 7"/>
                    </svg>
                    <span className="font-medium">iletisim@zipir.com</span>
                  </a>
                </div>
              )}
            </div>

          </div>
        </div>
      </div>
    </div>
  );
}
