import { Button } from '@/components/ui/button';
import {
  Dialog,
  DialogContent,
  DialogDescription,
  DialogFooter,
  DialogHeader,
  DialogTitle,
  DialogPortal,
  DialogOverlay,
} from '@/components/ui/dialog';

/**
 * Reusable confirmation modal component
 * @param {object} props - Component props
 * @param {boolean} props.isOpen - Whether the modal is open
 * @param {function} props.onClose - Handler to close the modal
 * @param {function} props.onConfirm - Handler to confirm the action
 * @param {string} [props.title] - Optional modal title
 * @param {string} [props.message] - Optional modal message
 * @param {boolean} [props.isLoading] - Whether an action is in progress (disables buttons)
 * @param {string} [props.confirmText] - Text for confirm button (default: "Confirm")
 * @param {string} [props.loadingText] - Text for confirm button when loading (default: "Processing...")
 * @param {string} [props.cancelText] - Text for cancel button (default: "Cancel")
 * @param {string} [props.confirmButtonStyle] - Style variant for confirm button ("danger" or "primary")
 */
const ConfirmationModal = ({
  isOpen,
  onClose,
  onConfirm,
  title,
  message,
  isLoading,
  confirmText = 'Confirm',
  loadingText = 'Processing...',
  cancelText = 'Cancel',
}) => {
  return (
    <Dialog open={isOpen} onOpenChange={onClose}>
      <DialogPortal>
        <DialogOverlay />
        <DialogContent className="sm:max-w-[425px] solid-popover-bg">
          <DialogHeader className="min-w-0">
            <DialogTitle>{title || 'Confirm Action'}</DialogTitle>
            <DialogDescription>{message || 'Are you sure?'}</DialogDescription>
          </DialogHeader>
          <DialogFooter>
            <Button
              type="button"
              onClick={onConfirm}
              disabled={isLoading}
              className="background-destructive"
            >
              {isLoading ? loadingText : confirmText}
            </Button>
            <Button
              type="button"
              variant="outline"
              onClick={onClose}
              disabled={isLoading}
            >
              {cancelText}
            </Button>
          </DialogFooter>
        </DialogContent>
      </DialogPortal>
    </Dialog>
  );
};

export default ConfirmationModal;
