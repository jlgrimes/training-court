'use client';

import {
  Toast,
  ToastClose,
  ToastDescription,
  ToastProvider,
  ToastTitle,
  ToastViewport,
} from '@/components/ui/toast';
import { useUI } from '@/app/recoil/hooks/useUI';

export function RecoilToaster() {
  const { toasts, dismissToast } = useUI();

  return (
    <ToastProvider>
      {toasts.map(({ id, title, description, action, type, ...props }) => {
        const variant = type === 'error' ? 'destructive' : 'default';
        
        return (
          <Toast key={id} variant={variant} {...props}>
            <div className="grid gap-1">
              {title && <ToastTitle>{title}</ToastTitle>}
              {description && (
                <ToastDescription>{description}</ToastDescription>
              )}
            </div>
            {action}
            <ToastClose onClick={() => dismissToast(id)} />
          </Toast>
        );
      })}
      <ToastViewport />
    </ToastProvider>
  );
}