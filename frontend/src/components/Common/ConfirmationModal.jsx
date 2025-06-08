const modalStyle = {
  position: "fixed",
  top: "50%",
  left: "50%",
  transform: "translate(-50%, -50%)",
  backgroundColor: "#fff",
  padding: "20px",
  zIndex: 1000,
  borderRadius: "8px",
  boxShadow: "0 4px 8px rgba(0, 0, 0, 0.1)",
  minWidth: "300px",
  maxWidth: "90%",
};

const overlayStyle = {
  position: "fixed",
  top: 0,
  left: 0,
  right: 0,
  bottom: 0,
  backgroundColor: "rgba(0, 0, 0, .7)",
  zIndex: 1000,
};

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
  confirmText = "Confirm",
  loadingText = "Processing...",
  cancelText = "Cancel",
  confirmButtonStyle = "danger",
}) => {
  if (!isOpen) {
    return null;
  }

  const handleOverlayClick = (e) => {
    // Close only if the click is directly on the overlay
    if (e.target === e.currentTarget && !isLoading) {
      onClose();
    }
  };

  const getConfirmButtonStyle = () => {
    const baseStyle = {
      marginRight: "10px",
      padding: "8px 16px",
      border: "none",
      borderRadius: "4px",
      cursor: isLoading ? "not-allowed" : "pointer",
    };

    if (confirmButtonStyle === "danger") {
      return {
        ...baseStyle,
        backgroundColor: isLoading ? "#ccc" : "#dc3545",
        color: "white",
      };
    } else {
      return {
        ...baseStyle,
        backgroundColor: isLoading ? "#ccc" : "#007bff",
        color: "white",
      };
    }
  };

  const getCancelButtonStyle = () => ({
    padding: "8px 16px",
    border: "1px solid #ccc",
    borderRadius: "4px",
    backgroundColor: "white",
    cursor: isLoading ? "not-allowed" : "pointer",
  });

  return (
    <>
      <div
        style={overlayStyle}
        onClick={handleOverlayClick}
        onKeyDown={(e) => {
          if (e.key === 'Escape' && !isLoading) {
            onClose();
          }
        }}
        role="button"
        tabIndex={0}
        data-testid="modal-overlay"
        aria-label="Close dialog"
      />
      <div
        style={modalStyle}
        role="dialog"
        aria-modal="true"
        aria-labelledby="confirmation-modal-title"
      >
        <h3 id="confirmation-modal-title">{title || "Confirm Action"}</h3>
        <p>{message || "Are you sure?"}</p>
        <div style={{ marginTop: "20px", textAlign: "right" }}>
          <button
            onClick={onConfirm}
            disabled={isLoading}
            style={getConfirmButtonStyle()}
          >
            {isLoading ? loadingText : confirmText}
          </button>
          <button 
            onClick={onClose} 
            disabled={isLoading}
            style={getCancelButtonStyle()}
          >
            {cancelText}
          </button>
        </div>
      </div>
    </>
  );
};

export default ConfirmationModal;
