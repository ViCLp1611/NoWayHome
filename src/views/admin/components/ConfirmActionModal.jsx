import React from 'react';
import { Button } from '@/app/components/ui/button';

export function ConfirmActionModal({
  open,
  type = 'confirm',
  title,
  description,
  onCancel,
  onConfirm,
  cancelLabel = 'Cancelar',
  confirmLabel,
  confirmVariant,
  confirmButtonClassName = '',
  disableCancel = false,
  disableConfirm = false,
}) {
  if (!open) return null;

  const isConfirm = type === 'confirm';
  const resolvedTitle =
    title || (type === 'success' ? 'Accion completada' : type === 'error' ? 'Error' : 'Confirmar accion');
  const resolvedConfirmLabel = confirmLabel || (isConfirm ? 'Confirmar' : 'Entendido');
  const resolvedConfirmVariant =
    confirmVariant || (type === 'error' ? 'adminDanger' : 'adminPrimary');

  return (
    <div className="fixed inset-0 z-50 flex items-center justify-center bg-black/40 p-4">
      <div className="w-full max-w-md rounded-lg bg-white p-6 shadow-xl">
        <h2 className="text-lg font-semibold text-[#333]">{resolvedTitle}</h2>
        <div className="mt-3 text-sm text-[#555]">{description}</div>

        <div className="mt-5 flex justify-end gap-2">
          {isConfirm && (
            <Button variant="adminSecondary" size="admin" onClick={onCancel} disabled={disableCancel}>
              {cancelLabel}
            </Button>
          )}
          <Button
            variant={resolvedConfirmVariant}
            size="admin"
            className={confirmButtonClassName}
            onClick={onConfirm}
            disabled={disableConfirm}
          >
            {resolvedConfirmLabel}
          </Button>
        </div>
      </div>
    </div>
  );
}
