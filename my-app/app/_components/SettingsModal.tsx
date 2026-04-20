"use client";

import { useState } from "react";
import { useTheme } from "next-themes";
import { SettingsTab } from "../../types";
import { HowToPlayContent } from "./HowToPlayContent";

/**
 * Ayarlar modalı bileşeni için props.
 */
interface SettingsModalProps {
  /** Modal açık mı? */
  isOpen: boolean;
  /** Modal kapatıldığında çağrılır */
  onClose: () => void;
  /** Başlangıçta aktif sekme (varsayılan: "nasil") */
  initialTab?: SettingsTab;
  /** Ses efektleri açık mı? */
  isSoundEnabled: boolean;
  /** Ses toggle değiştiğinde çağrılır */
  onSoundToggle: () => void;
}

/**
 * Oyun ayarlarının gösterildiği modal bileşeni.
 * 3 sekme içerir: Nasıl Oynanır?, Ses, Tema.
 * Giriş ekranı ve oyun ekranında ortak olarak kullanılır.
 */
export function SettingsModal({ 
  isOpen, 
  onClose, 
  initialTab = "nasil",
  isSoundEnabled, 
  onSoundToggle 
}: SettingsModalProps) {
  // Aktif sekme state'i
  const [activeTab, setActiveTab] = useState<SettingsTab>(initialTab);
  
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

        {/* Sekme Başlıkları */}
        <div className="flex border-b border-[var(--card-border)] px-6">
          {(["nasil", "ses", "tema"] as const).map((tab) => (
            <button
              key={tab}
              onClick={() => setActiveTab(tab)}
              className={`py-3 px-4 text-sm font-semibold border-b-2 transition-colors -mb-px ${
                activeTab === tab
                  ? "border-[var(--violet-500)] text-[var(--violet-600)]"
                  : "border-transparent text-[var(--slate-400)] hover:text-[var(--slate-600)]"
              }`}
            >
              {tab === "nasil" ? "Nasıl Oynanır?" : tab === "ses" ? "Ses" : "Tema"}
            </button>
          ))}
        </div>

        {/* Sekme İçerikleri */}
        <div className="p-6">
          {/* Nasıl Oynanır? */}
          {activeTab === "nasil" && <HowToPlayContent />}

          {/* Ses */}
          {activeTab === "ses" && (
            <div className="flex flex-col gap-4">
              <div className="flex items-center justify-between p-4 bg-[var(--bg-secondary)] rounded-xl border border-[var(--card-border)]">
                <div className="flex items-center gap-3">
                  <div className="p-2 bg-[var(--violet-100)] text-[var(--violet-600)] rounded-lg">
                    <svg xmlns="http://www.w3.org/2000/svg" width="18" height="18" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round">
                      {isSoundEnabled ? (
                        <>
                          <polygon points="11 5 6 9 2 9 2 15 6 15 11 19 11 5"/>
                          <path d="M15.54 8.46a5 5 0 0 1 0 7.07"/>
                          <path d="M19.07 4.93a10 10 0 0 1 0 14.14"/>
                        </>
                      ) : (
                        <>
                          <polygon points="11 5 6 9 2 9 2 15 6 15 11 19 11 5"/>
                          <line x1="23" y1="9" x2="17" y2="15"/>
                          <line x1="17" y1="9" x2="23" y2="15"/>
                        </>
                      )}
                    </svg>
                  </div>
                  <div>
                    <p className="font-semibold text-[var(--text-primary)] text-sm">Oyun Sesleri</p>
                    <p className="text-xs text-[var(--text-muted)] mt-0.5">Doğru/yanlış cevap efektleri</p>
                  </div>
                </div>
                <button
                  onClick={onSoundToggle}
                  className={`relative w-12 h-6 rounded-full transition-colors duration-200 ${isSoundEnabled ? "bg-[var(--violet-500)]" : "bg-[var(--slate-300)]"}`}
                  role="switch"
                  aria-checked={isSoundEnabled}
                >
                  <span className={`absolute top-0.5 left-0.5 w-5 h-5 bg-[var(--bg-primary)] rounded-full shadow-sm transition-transform duration-200 ${isSoundEnabled ? "translate-x-6" : "translate-x-0"}`} />
                </button>
              </div>
            </div>
          )}

          {/* Tema */}
          {activeTab === "tema" && (
            <div className="flex flex-col gap-4">
              <div className="grid grid-cols-2 gap-3">
                <button 
                  onClick={() => setTheme("light")}
                  className={`flex flex-col items-center gap-2 p-4 rounded-xl border-2 transition-all ${
                    theme === "light" 
                      ? "border-violet-500 bg-[var(--violet-50)]" 
                      : "border-[var(--slate-200)] bg-[var(--bg-secondary)] hover:border-[var(--violet-300)]"
                  }`}
                >
                  <div className="w-full h-10 rounded-lg bg-[var(--slate-50)] border border-[var(--slate-200)] flex items-center justify-center">
                    <span className="text-xs font-bold text-[var(--slate-700)]">Aa</span>
                  </div>
                  <span className={`text-xs font-semibold ${theme === "light" ? "text-[var(--violet-700)]" : "text-[var(--text-secondary)]"}`}>Açık</span>
                  {theme === "light" && <span className="w-2 h-2 rounded-full bg-[var(--violet-500)]"></span>}
                </button>
                <button 
                  onClick={() => setTheme("dark")}
                  className={`flex flex-col items-center gap-2 p-4 rounded-xl border-2 transition-all ${
                    theme === "dark" 
                      ? "border-violet-500 bg-[var(--violet-50)]" 
                      : "border-[var(--slate-200)] bg-[var(--bg-secondary)] hover:border-[var(--violet-300)]"
                  }`}
                >
                  <div className="w-full h-10 rounded-lg bg-[var(--slate-800)] border border-[var(--slate-700)] flex items-center justify-center">
                    <span className="text-xs font-bold text-[var(--slate-200)]">Aa</span>
                  </div>
                  <span className={`text-xs font-semibold ${theme === "dark" ? "text-[var(--violet-700)]" : "text-[var(--text-secondary)]"}`}>Koyu</span>
                  {theme === "dark" && <span className="w-2 h-2 rounded-full bg-[var(--violet-500)]"></span>}
                </button>
              </div>
            </div>
          )}
        </div>
      </div>
    </div>
  );
}
