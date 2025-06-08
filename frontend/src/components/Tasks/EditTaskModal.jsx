import { useState, useEffect, useContext } from 'react';
import TaskContext from '../../context/TaskContext';

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
  minWidth: '400px',
  maxWidth: '90%',
  maxHeight: '90vh',
  overflow: 'auto',
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

const EditTaskModal = ({ task, isOpen, onClose }) => {
  const [formData, setFormData] = useState({
    title: '',
    description: '',
    due_date: '',
    priority: 2,
  });
  const [error, setError] = useState('');
  const { updateTask, isLoadingTasks } = useContext(TaskContext);

  useEffect(() => {
    // Pre-fill form when task data changes (e.g., when modal opens for a specific task)
    if (task) {
      setFormData({
        title: task.title || '',
        description: task.description || '',
        due_date: task.due_date || '',
        priority: task.priority || 2,
      });
    }
  }, [task]);

  if (!isOpen || !task) {
    return null;
  }

  const validateForm = () => {
    // Whitespace-only title validation
    if (formData.title && !formData.title.trim()) {
      setError('Task title cannot be empty or contain only spaces.');
      return false;
    }

    // Past date validation
    if (formData.due_date) {
      const selectedDate = new Date(formData.due_date);
      const today = new Date();
      today.setHours(0, 0, 0, 0);

      if (selectedDate < today) {
        setError('Due date cannot be in the past.');
        return false;
      }
    }

    return true;
  };

  const handleSubmit = async (e) => {
    e.preventDefault();
    setError('');

    if (!validateForm()) {
      return;
    }

    try {
      const taskData = {
        title: formData.title.trim(),
        description: formData.description.trim() || null,
        due_date: formData.due_date || null,
        priority: parseInt(formData.priority),
      };

      await updateTask(task.id, taskData);
      onClose();
    } catch (err) {
      console.error('Update task error:', err);
      setError('Failed to update task. Please try again.');
    }
  };

  const handleChange = (e) => {
    setFormData({
      ...formData,
      [e.target.name]: e.target.value,
    });
  };

  return (
    <>
      <div
        style={overlayStyle}
        onClick={(e) => {
          if (e.target === e.currentTarget && !isLoadingTasks) {
            onClose();
          }
        }}
        onKeyDown={(e) => {
          if (e.key === 'Escape' && !isLoadingTasks) {
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
        aria-labelledby="edit-task-modal-title"
      >
        <h3 id="edit-task-modal-title">Edit Task</h3>
        <form onSubmit={handleSubmit}>
          {error ? <p style={{ color: 'red' }}>{error}</p> : null}

          <div style={{ marginBottom: '15px' }}>
            <label htmlFor="editTaskTitle">Task Title:</label>
            <input
              type="text"
              id="editTaskTitle"
              name="title"
              value={formData.title}
              onChange={handleChange}
              placeholder="e.g., Review project proposal, Fix login bug"
              required
              disabled={isLoadingTasks}
              maxLength={255}
              style={{ width: '100%', padding: '8px', marginTop: '5px' }}
            />
          </div>

          <div style={{ marginBottom: '15px' }}>
            <label htmlFor="editTaskDescription">Description (optional):</label>
            <textarea
              id="editTaskDescription"
              name="description"
              value={formData.description}
              onChange={handleChange}
              placeholder="Add more details about this task..."
              disabled={isLoadingTasks}
              rows={3}
              style={{ width: '100%', resize: 'vertical', padding: '8px', marginTop: '5px' }}
            />
          </div>

          <div style={{ marginBottom: '15px' }}>
            <label htmlFor="editTaskDueDate">Due Date (optional):</label>
            <input
              type="date"
              id="editTaskDueDate"
              name="due_date"
              value={formData.due_date}
              onChange={handleChange}
              disabled={isLoadingTasks}
              style={{ width: '100%', padding: '8px', marginTop: '5px' }}
            />
          </div>

          <div style={{ marginBottom: '15px' }}>
            <label htmlFor="editTaskPriority">Priority:</label>
            <select
              id="editTaskPriority"
              name="priority"
              value={formData.priority}
              onChange={handleChange}
              disabled={isLoadingTasks}
              style={{ width: '100%', padding: '8px', marginTop: '5px' }}
            >
              <option value={1}>Low</option>
              <option value={2}>Medium</option>
              <option value={3}>High</option>
            </select>
          </div>

          <div style={{ marginTop: '20px', textAlign: 'right' }}>
            <button type="submit" disabled={isLoadingTasks}>
              {isLoadingTasks ? 'Saving...' : 'Save Changes'}
            </button>
            <button
              type="button"
              onClick={onClose}
              style={{ marginLeft: '10px' }}
              disabled={isLoadingTasks}
            >
              Cancel
            </button>
          </div>
        </form>
      </div>
    </>
  );
};

export default EditTaskModal;
