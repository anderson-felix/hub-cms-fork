import { Modal } from './modal';
import { CancelButton, SubmitButton } from './form-buttons';

export function ConfirmDialog({
  open,
  onClose,
  onConfirm,
  title,
  description = 'Tem certeza disso? Essa ação é irreversível.',
  confirmLabel,
  tone = 'danger',
}: {
  open: boolean;
  onClose: () => void;
  onConfirm: () => void;
  title: string;
  description?: string;
  confirmLabel: string;
  tone?: 'danger' | 'neutral';
}) {
  return (
    <Modal
      open={open}
      onClose={onClose}
      title={title}
      width="max-w-md"
      footer={
        <>
          <CancelButton onClick={onClose} />
          <SubmitButton onClick={onConfirm} brandClass={tone === 'danger' ? 'bg-destructive' : 'bg-brand-redes'}>
            {confirmLabel}
          </SubmitButton>
        </>
      }
    >
      <p className="text-sm text-muted-foreground">{description}</p>
    </Modal>
  );
}
