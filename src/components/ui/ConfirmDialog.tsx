import { Modal } from './Modal';
import { Button } from './Button';
import { Loader2 } from 'lucide-react';

interface ConfirmDialogProps {
  open: boolean;
  onClose: () => void;
  onConfirm: () => void | Promise<void>;
  title: string;
  message: string;
  confirmText?: string;
  cancelText?: string;
  confirmLabel?: string; // Backward compat
  danger?: boolean; // Backward compat
  isDestructive?: boolean;
  isLoading?: boolean;
}

export function ConfirmDialog({
  open,
  onClose,
  onConfirm,
  title,
  message,
  confirmText,
  cancelText = 'Cancel',
  confirmLabel, // Backward compat
  danger, // Backward compat
  isDestructive,
  isLoading = false,
}: ConfirmDialogProps) {
  // Handle backward compatibility
  const finalConfirmText = confirmText ?? confirmLabel ?? 'Confirm';
  const finalIsDestructive = isDestructive ?? danger ?? false;

  const handleConfirm = async () => {
    await onConfirm();
    onClose();
  };

  return (
    <Modal open={open} onClose={onClose} title={title} size="sm">
      <p className="text-sm text-neutral-600 mb-6">{message}</p>
      <div className="flex gap-3 justify-end">
        <Button variant="outline" onClick={onClose} disabled={isLoading}>{cancelText}</Button>
        <Button 
          variant={finalIsDestructive ? 'danger' : 'primary'} 
          onClick={handleConfirm}
          disabled={isLoading}
          className={isLoading ? 'opacity-60' : ''}
        >
          {isLoading && <Loader2 size={16} className="animate-spin mr-2" />}
          {finalConfirmText}
        </Button>
      </div>
    </Modal>
  );
}
