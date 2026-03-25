import React from 'react';
import { Button } from '@/app/components/ui/button';

export function ConfirmActionModal({
  open,
  title,
  description,
  onCancel,
  onConfirm,
  cancelLabel = 'Cancelar',
  confirmLabel = 'Confirmar',
  confirmButtonClassName = 'bg-[#6B8E23] hover:bg-[#5a7a1d] text-white',
  disableCancel = false,
  disableConfirm = false,
}) {
  if (!open) return null;

  return (
    <div className="fixed inset-0 z-50 flex items-center justify-center bg-black/40 p-4">
      <div className="w-full max-w-md rounded-lg bg-white p-6 shadow-xl">
        <h2 className="text-lg font-semibold text-[#333]">{title}</h2>
        <div className="mt-3 text-sm text-[#555]">{description}</div>
        <div className="mt-5 flex justify-end gap-2">
          <Button variant="outline" onClick={onCancel} disabled={disableCancel}>
            {cancelLabel}
          </Button>
          <Button className={confirmButtonClassName} onClick={onConfirm} disabled={disableConfirm}>
            {confirmLabel}
          </Button>
        </div>
      </div>
    </div>
  );
}
