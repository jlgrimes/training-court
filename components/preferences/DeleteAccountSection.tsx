'use client';

import { useState } from 'react';
import { useUI } from '@/app/recoil/hooks/useUI';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';

export function DeleteAccountSection() {
  const { showErrorToast, showSuccessToast } = useUI();
  const [isDeleting, setIsDeleting] = useState(false);
  const [isConfirming, setIsConfirming] = useState(false);
  const [confirmText, setConfirmText] = useState('');

  const startConfirmation = () => {
    setIsConfirming(true);
    setConfirmText('');
  };

  const cancelConfirmation = () => {
    if (isDeleting) return;
    setIsConfirming(false);
    setConfirmText('');
  };

  const handleDelete = async () => {
    setIsDeleting(true);

    try {
      const response = await fetch('/api/account/delete', {
        method: 'POST',
      });

      const payload = await response.json();
      if (!response.ok) {
        throw new Error(payload?.error || 'Unable to delete account.');
      }

      showSuccessToast('Account deleted.');
      window.location.href = '/login';
    } catch (error) {
      const message = error instanceof Error ? error.message : 'Unable to delete account.';
      showErrorToast(message);
      setIsDeleting(false);
    }
  };

  const isConfirmationValid = confirmText.trim().toUpperCase() === 'DELETE';
  const canPermanentlyDelete = isConfirmationValid && !isDeleting;

  return (
    <div className='flex flex-col gap-3'>
      {!isConfirming && (
        <div className='flex justify-end'>
          <Button
            type='button'
            variant='destructive'
            onClick={startConfirmation}
            disabled={isDeleting}
          >
            Delete account
          </Button>
        </div>
      )}

      {isConfirming && (
        <div className='space-y-3 rounded-md border border-destructive/40 p-4'>
          <p className='text-sm text-muted-foreground'>
            This action is permanent. Type <span className='font-semibold text-foreground'>DELETE</span> to continue.
          </p>
          <div className='space-y-2'>
            <Input
              id='delete-confirm'
              value={confirmText}
              onChange={(e) => setConfirmText(e.target.value)}
              placeholder='DELETE'
              disabled={isDeleting}
            />
          </div>
          <div className='flex justify-end gap-2'>
            <Button
              type='button'
              variant='outline'
              onClick={cancelConfirmation}
              disabled={isDeleting}
            >
              Cancel
            </Button>
            <Button
              type='button'
              variant='destructive'
              onClick={handleDelete}
              disabled={!canPermanentlyDelete}
            >
              {isDeleting ? 'Deleting...' : 'Permanently delete account'}
            </Button>
          </div>
        </div>
      )}
    </div>
  );
}
