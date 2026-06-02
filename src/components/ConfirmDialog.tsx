import { useEffect, useRef } from 'react';
import { ConfirmDialogProps } from '../types';
import './ConfirmDialog.css';

export function ConfirmDialog({ isOpen, mensagem, onConfirmar, onCancelar }: ConfirmDialogProps) {
  const cancelarRef = useRef<HTMLButtonElement>(null);

  useEffect(() => {
    if (isOpen && cancelarRef.current) {
      cancelarRef.current.focus();
    }
  }, [isOpen]);

  useEffect(() => {
    if (!isOpen) return;

    function handleKeyDown(e: KeyboardEvent) {
      if (e.key === 'Escape') {
        onCancelar();
      }
    }

    document.addEventListener('keydown', handleKeyDown);
    return () => document.removeEventListener('keydown', handleKeyDown);
  }, [isOpen, onCancelar]);

  if (!isOpen) return null;

  return (
    <div className="confirm-dialog__overlay" onClick={onCancelar} role="presentation">
      <div
        className="confirm-dialog"
        role="alertdialog"
        aria-modal="true"
        aria-labelledby="confirm-dialog-message"
        onClick={(e) => e.stopPropagation()}
      >
        <p id="confirm-dialog-message" className="confirm-dialog__mensagem">
          {mensagem}
        </p>
        <div className="confirm-dialog__acoes">
          <button
            className="confirm-dialog__botao confirm-dialog__botao--cancelar"
            onClick={onCancelar}
            ref={cancelarRef}
            type="button"
          >
            Cancelar
          </button>
          <button
            className="confirm-dialog__botao confirm-dialog__botao--confirmar"
            onClick={onConfirmar}
            type="button"
          >
            Confirmar
          </button>
        </div>
      </div>
    </div>
  );
}
