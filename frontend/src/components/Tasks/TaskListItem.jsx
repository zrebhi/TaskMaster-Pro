import { useContext } from 'react';
import TaskContext from '../../context/TaskContext';

const listItemStyle = {
  padding: '10px 15px',
  border: '1px solid #ddd',
  marginBottom: '8px',
  borderRadius: '4px',
  backgroundColor: '#fff',
  display: 'flex',
  justifyContent: 'space-between',
  alignItems: 'center',
};

const buttonStyle = {
  padding: '4px 8px',
  fontSize: '0.8em',
  border: '1px solid #ccc',
  borderRadius: '4px',
  backgroundColor: '#fff',
  cursor: 'pointer',
  marginLeft: '5px',
};

const editButtonStyle = {
  ...buttonStyle,
  borderColor: '#007bff',
  color: '#007bff',
};

const deleteButtonStyle = {
  ...buttonStyle,
  borderColor: '#dc3545',
  color: '#dc3545',
};

const TaskListItem = ({ task, onEditClick, onDeleteClick }) => {
  const { updateTask, isLoadingTasks } = useContext(TaskContext);

  if (!task) return null;

  const formatPriority = (priority) => {
    const priorityMap = {
      1: 'Low',
      2: 'Medium',
      3: 'High',
    };
    return priorityMap[priority] || 'Medium';
  };

  const formatDate = (dateString) => {
    try {
      return new Date(dateString).toLocaleDateString();
    } catch {
      return dateString;
    }
  };

  const handleToggleComplete = async () => {
    try {
      await updateTask(task.id, { is_completed: !task.is_completed });
    } catch (err) {
      // Error handling is done in the context
      console.error('Failed to toggle task completion:', err);
    }
  };

  return (
    <li style={listItemStyle}>
      <div style={{ display: 'flex', alignItems: 'center', gap: '10px' }}>
        <input
          type="checkbox"
          checked={task.is_completed || false}
          onChange={handleToggleComplete}
          disabled={isLoadingTasks}
          style={{ cursor: 'pointer' }}
          aria-label={`Mark "${task.title}" as ${task.is_completed ? 'incomplete' : 'complete'}`}
        />
        <div style={{ display: 'flex', flexDirection: 'column', flexGrow: 1 }}>
          <span
            style={{
              fontWeight: 'bold',
              marginBottom: '4px',
              textDecoration: task.is_completed ? 'line-through' : 'none',
              color: task.is_completed ? '#888' : 'inherit',
            }}
          >
            {task.title}
          </span>
          {task.description ? (
            <span
              style={{
                fontSize: '0.9em',
                color: task.is_completed ? '#aaa' : '#666',
                marginBottom: '4px',
                textDecoration: task.is_completed ? 'line-through' : 'none',
              }}
            >
              {task.description}
            </span>
          ) : null}
        </div>
      </div>
      <div style={{ display: 'flex', gap: '10px', alignItems: 'center' }}>
        {task.priority ? (
          <span
            style={{
              fontSize: '0.8em',
              padding: '2px 6px',
              borderRadius: '4px',
              backgroundColor:
                task.priority === 3
                  ? '#ffebee'
                  : task.priority === 1
                    ? '#e8f5e8'
                    : '#fff3e0',
              color:
                task.priority === 3
                  ? '#c62828'
                  : task.priority === 1
                    ? '#2e7d32'
                    : '#ef6c00',
              border: `1px solid ${task.priority === 3 ? '#ffcdd2' : task.priority === 1 ? '#c8e6c9' : '#ffcc02'}`,
            }}
          >
            {formatPriority(task.priority)}
          </span>
        ) : null}
        {task.due_date ? (
          <span style={{ fontSize: '0.8em', color: '#555' }}>
            Due: {formatDate(task.due_date)}
          </span>
        ) : null}
        <div style={{ display: 'flex', gap: '5px' }}>
          <button
            style={editButtonStyle}
            onClick={() => onEditClick && onEditClick(task)}
            disabled={isLoadingTasks}
            aria-label={`Edit task "${task.title}"`}
          >
            Edit
          </button>
          <button
            style={deleteButtonStyle}
            onClick={() => onDeleteClick && onDeleteClick(task)}
            disabled={isLoadingTasks}
            aria-label={`Delete task "${task.title}"`}
          >
            Delete
          </button>
        </div>
      </div>
    </li>
  );
};

export default TaskListItem;
