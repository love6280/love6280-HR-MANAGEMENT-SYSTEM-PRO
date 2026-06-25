import React from 'react';
import Modal from './Modal';
import Button from './Button';

const ConfirmDialog = ({
  title = 'Are you sure?',
  message = 'This action cannot be undone.',
  onConfirm,
  isOpen = false,
  onClose,
  confirmText = 'Confirm',
  cancelText = 'Cancel',
}) => {
  const handleConfirm = () => {
    onConfirm();
    onClose();
  };

  return (
    <Modal title={title} isOpen={isOpen} onClose={onClose} size="sm">
      <div className="flex flex-col gap-4">
        <p className="text-sm text-text-secondary">
          {message}
        </p>
        <div className="flex items-center justify-end gap-3 mt-2">
          <Button variant="ghost" onClick={onClose}>
            {cancelText}
          </Button>
          <Button variant="danger" onClick={handleConfirm}>
            {confirmText}
          </Button>
        </div>
      </div>
    </Modal>
  );
};

export default ConfirmDialog;
