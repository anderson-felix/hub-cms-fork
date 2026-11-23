import { ShieldCheck, ShieldOff } from 'lucide-react';

import { Modal } from '@/components/ui/modal';
import { CancelButton } from '@/components/ui/form-buttons';

/**
 * Access is enforced per user (`disabled_at`), so a network/school/class has no readable "restricted"
 * status. This modal is therefore an action picker: enable or restrict login for everyone under it.
 */
export function AccessControlModal({
  open,
  onClose,
  title,
  description,
  onEnable,
  onRestrict,
}: {
  open: boolean;
  onClose: () => void;
  title: string;
  description: string;
  onEnable: () => void;
  onRestrict: () => void;
}) {
  return (
    <Modal open={open} onClose={onClose} title={title} width="max-w-md" footer={<CancelButton onClick={onClose} />}>
      <div className="space-y-4">
        <p className="text-sm text-muted-foreground">{description}</p>
        <div className="grid gap-2">
          <button
            type="button"
            onClick={onEnable}
            className="inline-flex items-center justify-center gap-2 px-4 py-2.5 text-sm font-semibold rounded-lg border border-emerald-500/30 text-emerald-600 hover:bg-emerald-500/10 transition"
          >
            <ShieldCheck className="size-4" /> Habilitar acessos
          </button>
          <button
            type="button"
            onClick={onRestrict}
            className="inline-flex items-center justify-center gap-2 px-4 py-2.5 text-sm font-semibold rounded-lg border border-destructive/30 text-destructive hover:bg-destructive/10 transition"
          >
            <ShieldOff className="size-4" /> Restringir acessos
          </button>
        </div>
        <p className="text-[11px] text-muted-foreground">O status atual não é exibido: basta escolher a ação desejada. Você pode alternar a qualquer momento.</p>
      </div>
    </Modal>
  );
}
