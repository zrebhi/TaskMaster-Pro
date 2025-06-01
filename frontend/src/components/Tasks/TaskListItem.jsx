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

const TaskListItem = ({ task }) => {
  if (!task) return null;

  const formatPriority = (priority) => {
    const priorityMap = {
      1: 'Low',
      2: 'Medium', 
      3: 'High'
    };
    return priorityMap[priority] || 'Medium';
  };

  const formatDate = (dateString) => {
    if (!dateString) return null;
    try {
      return new Date(dateString).toLocaleDateString();
    } catch {
      return dateString;
    }
  };

  return (
    <li style={listItemStyle}>
      <div style={{ display: 'flex', flexDirection: 'column', flexGrow: 1 }}>
        <span style={{ fontWeight: 'bold', marginBottom: '4px' }}>
          {task.title}
        </span>
        {task.description ? <span style={{ fontSize: '0.9em', color: '#666', marginBottom: '4px' }}>
            {task.description}
          </span> : null}
      </div>
      <div style={{ display: 'flex', gap: '10px', alignItems: 'center' }}>
        {task.priority ? <span 
            style={{
              fontSize: '0.8em', 
              padding: '2px 6px', 
              borderRadius: '4px', 
              backgroundColor: task.priority === 3 ? '#ffebee' : task.priority === 1 ? '#e8f5e8' : '#fff3e0',
              color: task.priority === 3 ? '#c62828' : task.priority === 1 ? '#2e7d32' : '#ef6c00',
              border: `1px solid ${task.priority === 3 ? '#ffcdd2' : task.priority === 1 ? '#c8e6c9' : '#ffcc02'}`
            }}
          >
            {formatPriority(task.priority)}
          </span> : null}
        {task.due_date ? <span style={{ fontSize: '0.8em', color: '#555' }}>
            Due: {formatDate(task.due_date)}
          </span> : null}
      </div>
    </li>
  );
};

export default TaskListItem;
