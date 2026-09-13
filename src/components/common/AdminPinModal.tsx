import React, { useState, useEffect, useRef } from 'react';
import { ShieldCheck, Lock, AlertCircle, X } from 'lucide-react';
import { AdminAuthService } from '../../services/adminAuthService';

interface AdminPinModalProps {
  isOpen: boolean;
  onClose: () => void;
  onSuccess: () => void;
  actionDescription?: string;
}

export const AdminPinModal: React.FC<AdminPinModalProps> = ({
  isOpen,
  onClose,
  onSuccess,
  actionDescription,
}) => {
  const [pin, setPin] = useState('');
  const [errorMessage, setErrorMessage] = useState<string | null>(null);
  const [isVerifying, setIsVerifying] = useState(false);
  const inputRef = useRef<HTMLInputElement>(null);

  // Auto-focus and reset on open
  useEffect(() => {
    if (isOpen) {
      setPin('');
      setErrorMessage(null);
      setIsVerifying(false);
      const timer = setTimeout(() => {
        inputRef.current?.focus();
      }, 50);
      return () => clearTimeout(timer);
    }
  }, [isOpen]);

  // Escape key handler
  useEffect(() => {
    const handleKeyDown = (e: KeyboardEvent) => {
      if (e.key === 'Escape' && isOpen) {
        onClose();
      }
    };
    if (isOpen) {
      window.addEventListener('keydown', handleKeyDown);
    }
    return () => {
      window.removeEventListener('keydown', handleKeyDown);
    };
  }, [isOpen, onClose]);

  const handleValidate = (candidatePin: string) => {
    if (isVerifying) return;
    setIsVerifying(true);

    const result = AdminAuthService.verifyPin(candidatePin);

    if (result.success) {
      setErrorMessage(null);
      setPin('');
      setIsVerifying(false);
      onSuccess();
      onClose();
    } else {
      setErrorMessage(result.error || 'PIN salah. Sila cuba lagi.');
      setPin('');
      setIsVerifying(false);
      // Re-focus the input
      setTimeout(() => {
        inputRef.current?.focus();
      }, 50);
    }
  };

  const handleInputChange = (e: React.ChangeEvent<HTMLInputElement>) => {
    const val = e.target.value;
    // Allow only digits, max 4 digits
    const digitsOnly = val.replace(/\D/g, '').slice(0, 4);
    setPin(digitsOnly);
    setErrorMessage(null);

    // Digit 4 -> automatically validate
    if (digitsOnly.length === 4) {
      handleValidate(digitsOnly);
    }
  };

  const handleKeyDownInput = (e: React.KeyboardEvent<HTMLInputElement>) => {
    if (e.key === 'Enter') {
      e.preventDefault();
      handleValidate(pin);
    }
  };

  if (!isOpen) return null;

  const lockout = AdminAuthService.isLockedOut();

  return (
    <div
      id="admin-pin-modal-backdrop"
      className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-stone-900/60 backdrop-blur-xs"
      onClick={(e) => {
        if (e.target === e.currentTarget) onClose();
      }}
    >
      <div
        className="bg-white rounded-xl shadow-2xl border border-stone-200 w-full max-w-sm overflow-hidden animate-in fade-in zoom-in-95 duration-150"
        role="dialog"
        aria-modal="true"
        aria-labelledby="admin-pin-modal-title"
      >
        {/* Header */}
        <div className="flex items-center justify-between p-4 border-b border-stone-100 bg-stone-50">
          <div className="flex items-center gap-2">
            <div className="w-8 h-8 rounded-lg bg-orange-100 text-orange-700 flex items-center justify-center">
              <Lock className="w-4 h-4" />
            </div>
            <div>
              <h3 id="admin-pin-modal-title" className="text-sm font-bold text-stone-900">
                Akses Mod Admin
              </h3>
              {actionDescription && (
                <p className="text-[11px] text-stone-500 line-clamp-1">{actionDescription}</p>
              )}
            </div>
          </div>
          <button
            type="button"
            onClick={onClose}
            className="text-stone-400 hover:text-stone-700 p-1 rounded-md hover:bg-stone-200/60 transition cursor-pointer"
            aria-label="Tutup"
          >
            <X className="w-4 h-4" />
          </button>
        </div>

        {/* Content */}
        <div className="p-5">
          <p className="text-xs text-stone-600 mb-4 text-center">
            Sila masukkan 4-digit PIN keselamatan untuk membuka kebenaran pentadbir Kedai PAPA.
          </p>

          <div className="space-y-3">
            <div>
              <input
                ref={inputRef}
                id="admin-pin-input"
                type="password"
                inputMode="numeric"
                pattern="[0-9]*"
                maxLength={4}
                value={pin}
                disabled={lockout.locked}
                onChange={handleInputChange}
                onKeyDown={handleKeyDownInput}
                placeholder="Masukkan 4-digit PIN"
                className="w-full text-center text-xl tracking-[0.4em] font-mono px-4 py-2.5 rounded-lg border border-stone-300 focus:outline-hidden focus:ring-2 focus:ring-orange-500 focus:border-orange-500 transition disabled:bg-stone-100 disabled:text-stone-400"
                autoComplete="off"
              />
            </div>

            {/* Error Message */}
            {errorMessage && (
              <div
                id="admin-pin-error-alert"
                className="flex items-center gap-1.5 p-2 rounded-lg bg-rose-50 border border-rose-200 text-rose-700 text-xs"
              >
                <AlertCircle className="w-4 h-4 shrink-0 text-rose-500" />
                <span>{errorMessage}</span>
              </div>
            )}

            {lockout.locked && (
              <div className="p-2 rounded-lg bg-amber-50 border border-amber-200 text-amber-800 text-xs text-center font-medium">
                Sistem dikunci sementara. Sila tunggu {lockout.remainingSeconds} saat.
              </div>
            )}

            {/* Action Buttons */}
            <div className="flex items-center gap-2 pt-2">
              <button
                type="button"
                onClick={onClose}
                className="w-1/2 py-2 text-xs font-semibold rounded-lg border border-stone-300 text-stone-700 hover:bg-stone-50 transition cursor-pointer"
              >
                Batal
              </button>
              <button
                type="button"
                id="admin-pin-submit-btn"
                disabled={lockout.locked || pin.length === 0}
                onClick={() => handleValidate(pin)}
                className="w-1/2 py-2 text-xs font-semibold rounded-lg bg-orange-600 hover:bg-orange-700 text-white transition disabled:opacity-50 disabled:cursor-not-allowed shadow-xs cursor-pointer flex items-center justify-center gap-1.5"
              >
                <ShieldCheck className="w-3.5 h-3.5" />
                <span>Sahkan PIN</span>
              </button>
            </div>
          </div>
        </div>
      </div>
    </div>
  );
};
