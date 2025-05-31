// Basic Modal Styling (can be improved)
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
 * @param {object} props - Component props
 * @param {boolean} props.isOpen - Whether the modal is open
 * @param {function} props.onClose - Handler to close the modal
 * @param {function} props.onConfirm - Handler to confirm the action (e.g., delete)
 * @param {string} [props.title] - Optional modal title
 * @param {string} [props.message] - Optional modal message
 * @param {boolean} [props.isLoading] - Whether an action is in progress (disables buttons)
 */
const DeleteProjectModal = ({
  isOpen,
  onClose,
  onConfirm,
  title,
  message,
  isLoading,
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

  return (
    <>
      <div
        style={overlayStyle}
        onClick={handleOverlayClick} // Uses the modified handler
        onKeyDown={(e) => {
          if (e.key === 'Escape' && !isLoading) {
            onClose(); // Closes modal on Escape key press
          }
        }}
        role="button" // Makes it interactive and announces its role
        tabIndex={0}  // Makes it focusable via keyboard
        data-testid="modal-overlay"
        aria-label="Close dialog" // Provides an accessible name
      />
      <div
        style={modalStyle}
        role="dialog" // Identifies the element as a dialog
        aria-modal="true" // Indicates it's a modal dialog
        aria-labelledby="delete-project-modal-title" // Associates with the title
      >
        <h3 id="delete-project-modal-title">{title || "Confirm Action"}</h3>
        <p>{message || "Are you sure?"}</p>
        <div style={{ marginTop: "20px", textAlign: "right" }}>
          <button
            onClick={onConfirm}
            disabled={isLoading}
            style={{
              marginRight: "10px",
              backgroundColor: "red",
              color: "white",
            }}
          >
            {isLoading ? "Deleting..." : "Confirm"}
          </button>
          <button onClick={onClose} disabled={isLoading}>
            Cancel
          </button>
        </div>
      </div>
    </>
  );
};

export default DeleteProjectModal;
