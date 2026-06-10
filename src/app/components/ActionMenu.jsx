import { useEffect, useMemo, useRef, useState } from 'react';
import { createPortal } from 'react-dom';
import { MoreHorizontal } from 'lucide-react';
import { cn } from '@/app/components/ui/utils';

const MENU_WIDTH = 176;

const actionVariantClasses = {
  view: 'text-[#5F5F5F]',
  neutral: 'text-[#5F5F5F]',
  edit: 'text-[#A67C52]',
  primary: 'text-[#6B8E23]',
  danger: 'text-[#B42318]',
};

export function ActionMenu({ actions = [], label = 'Abrir acciones', align = 'end' }) {
  const [open, setOpen] = useState(false);
  const [position, setPosition] = useState({ top: 0, left: 0 });
  const triggerRef = useRef(null);
  const menuRef = useRef(null);
  const availableActions = useMemo(() => actions.filter(Boolean), [actions]);

  const updateMenuPosition = () => {
    const trigger = triggerRef.current;
    if (!trigger) return;

    const rect = trigger.getBoundingClientRect();
    const preferredLeft = align === 'end' ? rect.right - MENU_WIDTH : rect.left;
    const left = Math.max(8, Math.min(preferredLeft, window.innerWidth - MENU_WIDTH - 8));

    setPosition({
      top: rect.bottom + 8,
      left,
    });
  };

  useEffect(() => {
    if (!open) return undefined;

    updateMenuPosition();

    const handlePointerDown = (event) => {
      if (
        triggerRef.current?.contains(event.target) ||
        menuRef.current?.contains(event.target)
      ) {
        return;
      }

      setOpen(false);
    };

    const handleKeyDown = (event) => {
      if (event.key === 'Escape') {
        setOpen(false);
        triggerRef.current?.focus();
      }
    };

    const handleLayoutChange = () => {
      updateMenuPosition();
    };

    document.addEventListener('pointerdown', handlePointerDown);
    document.addEventListener('keydown', handleKeyDown);
    window.addEventListener('resize', handleLayoutChange);
    window.addEventListener('scroll', handleLayoutChange, true);

    return () => {
      document.removeEventListener('pointerdown', handlePointerDown);
      document.removeEventListener('keydown', handleKeyDown);
      window.removeEventListener('resize', handleLayoutChange);
      window.removeEventListener('scroll', handleLayoutChange, true);
    };
  }, [open, align]);

  const menu = open ? (
    <div
      ref={menuRef}
      role="menu"
      className="fixed z-[9999] min-w-[176px] rounded-lg border border-[#6B8E23]/15 bg-white p-1 shadow-lg"
      style={{ top: position.top, left: position.left }}
      onClick={(event) => event.stopPropagation()}
    >
      {availableActions.length > 0 ? (
        availableActions.map((action, index) => (
          <button
            key={`${action.label}-${index}`}
            type="button"
            role="menuitem"
            disabled={action.disabled}
            onClick={(event) => {
              event.preventDefault();
              event.stopPropagation();

              if (action.disabled) return;

              action.onClick?.();
              setOpen(false);
            }}
            className={cn(
              'block w-full rounded-md px-4 py-2 text-left font-[Inter] text-sm hover:bg-[#F2E8CF] focus:bg-[#F2E8CF] focus:outline-none disabled:pointer-events-none disabled:opacity-50',
              actionVariantClasses[action.variant] || actionVariantClasses.neutral,
              action.className
            )}
          >
            {action.label}
          </button>
        ))
      ) : (
        <div className="px-4 py-2 text-sm text-gray-400">Sin acciones</div>
      )}
    </div>
  ) : null;

  return (
    <>
      <button
        ref={triggerRef}
        type="button"
        aria-label={label}
        aria-haspopup="menu"
        aria-expanded={open}
        onClick={(event) => {
          event.preventDefault();
          event.stopPropagation();
          setOpen((prev) => !prev);
        }}
        className="inline-flex size-9 items-center justify-center rounded-lg text-[#5F5F5F] transition-colors hover:bg-[#F2E8CF] hover:text-[#A67C52] focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-[#6B8E23]/40"
      >
        <MoreHorizontal className="h-5 w-5" aria-hidden="true" />
      </button>
      {typeof document !== 'undefined' ? createPortal(menu, document.body) : menu}
    </>
  );
}
