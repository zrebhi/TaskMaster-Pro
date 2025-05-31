import { useState, useEffect, useContext } from 'react';
import ProjectContext from '../../context/ProjectContext';

const modalStyle = {
  position: 'fixed',
  top: '50%',
  left: '50%',
  transform: 'translate(-50%, -50%)',
  backgroundColor: 'white',
  padding: '20px',
  zIndex: 1000,
  border: '1px solid #ccc',
  borderRadius: '8px',
  boxShadow: '0 4px 6px rgba(0,0,0,0.1)',
};
const overlayStyle = {
  position: 'fixed',
  top: 0,
  left: 0,
  right: 0,
  bottom: 0,
  backgroundColor: 'rgba(0,0,0,0.5)',
  zIndex: 999,
};

const EditProjectModal = ({ project, isOpen, onClose }) => {
  const [projectName, setProjectName] = useState('');
  const [error, setError] = useState('');
  const { updateProject, isLoading } = useContext(ProjectContext);

  useEffect(() => {
    // Pre-fill form when project data changes (e.g., when modal opens for a specific project)
    if (project) {
      setProjectName(project.name);
    }
  }, [project]);

  if (!isOpen || !project) {return null;}

  const handleSubmit = async (e) => {
    e.preventDefault();
    setError('');
    if (!projectName.trim()) {
      setError('Project name cannot be empty.');
      return;
    }

    try {
      await updateProject(project.id, { name: projectName.trim() });

      onClose();
    } catch (err) {
      console.error('Update project error:', err);
      setError('Failed to update project. Please try again.');
    }
  };

  return (
    <>
      <div
        style={overlayStyle}
        onClick={(e) => {
          // Close only if the click is directly on the overlay and not loading
          if (e.target === e.currentTarget && !isLoading) {
            onClose();
          }
        }}
        onKeyDown={(e) => {
          if (e.key === 'Escape' && !isLoading) {
            onClose();
          }
        }}
        role="button"
        tabIndex={0}
        aria-label="Close dialog"
      />
      <div
        style={modalStyle}
        role="dialog"
        aria-modal="true"
        aria-labelledby="edit-project-modal-title"
      >
        <h3 id="edit-project-modal-title">Edit Project</h3>
        <form onSubmit={handleSubmit}>
          {error ? <p style={{ color: 'red' }}>{error}</p> : null}
          <div>
            <label htmlFor="editProjectName">Project Name:</label>
            <input
              type="text"
              id="editProjectName"
              value={projectName}
              onChange={(e) => setProjectName(e.target.value)}
              required
              disabled={isLoading}
            />
          </div>
          <div style={{ marginTop: '10px' }}>
            <button type="submit" disabled={isLoading}>
              {isLoading ? 'Saving...' : 'Save Changes'}
            </button>
            <button
              type="button"
              onClick={onClose}
              style={{ marginLeft: '10px' }}
              disabled={isLoading}
            >
              Cancel
            </button>
          </div>
        </form>
      </div>
    </>
  );
};

export default EditProjectModal;
