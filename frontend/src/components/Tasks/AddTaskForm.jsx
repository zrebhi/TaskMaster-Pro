import { useState, useContext } from 'react';
import TaskContext from '../../context/TaskContext';

const AddTaskForm = ({ projectId }) => {
  const [formData, setFormData] = useState({
    title: '',
    description: '',
    due_date: '',
    priority: 2,
  });
  const [error, setError] = useState('');
  const { addTask, isLoadingTasks } = useContext(TaskContext);

  const { title, description, due_date, priority } = formData;

  const onChange = (e) => {
    setFormData({ ...formData, [e.target.name]: e.target.value });
  };

  const validateForm = () => {
    // Custom validation for cases HTML5 doesn't handle well

    // Whitespace-only title validation (HTML5 required allows whitespace)
    if (title && !title.trim()) {
      setError('Task title cannot be empty or contain only spaces.');
      return false;
    }

    // Past date validation (HTML5 doesn't prevent past dates)
    if (due_date) {
      const selectedDate = new Date(due_date);
      const today = new Date();
      today.setHours(0, 0, 0, 0); // Reset time to start of day for comparison

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

    if (!projectId) {
      setError('No project selected.');
      return;
    }

    try {
      const taskData = {
        title: title.trim(),
        description: description.trim() || null,
        due_date: due_date || null,
        priority: parseInt(priority),
      };

      await addTask(projectId, taskData);

      // Reset form on success
      setFormData({
        title: '',
        description: '',
        due_date: '',
        priority: 2,
      });
    } catch {
      setError('Failed to create task. Please try again.');
    }
  };

  return (
    <form onSubmit={handleSubmit}>
      <h4>Create New Task</h4>
      {error ? <p id="error-message" style={{ color: 'red' }}>{error}</p> : null}

      <div>
        <label htmlFor="taskTitle">Task Title:</label>
        <input
          type="text"
          id="taskTitle"
          name="title"
          value={title}
          onChange={onChange}
          placeholder="e.g., Review project proposal, Fix login bug"
          required
          disabled={isLoadingTasks}
          maxLength={255}
        />
      </div>

      <div>
        <label htmlFor="taskDescription">Description (optional):</label>
        <textarea
          id="taskDescription"
          name="description"
          value={description}
          onChange={onChange}
          placeholder="Add more details about this task..."
          disabled={isLoadingTasks}
          rows={3}
          style={{ width: '100%', resize: 'vertical' }}
        />
      </div>

      <div>
        <label htmlFor="taskDueDate">Due Date (optional):</label>
        <input
          type="date"
          id="taskDueDate"
          name="due_date"
          value={due_date}
          onChange={onChange}
          disabled={isLoadingTasks}
        />
      </div>

      <div>
        <label htmlFor="taskPriority">Priority:</label>
        <select
          id="taskPriority"
          name="priority"
          value={priority}
          onChange={onChange}
          disabled={isLoadingTasks}
        >
          <option value={1}>Low</option>
          <option value={2}>Medium</option>
          <option value={3}>High</option>
        </select>
      </div>

      <button type="submit" disabled={isLoadingTasks}>
        {isLoadingTasks ? 'Creating...' : 'Create Task'}
      </button>
    </form>
  );
};

export default AddTaskForm;
