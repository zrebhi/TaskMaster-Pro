import TaskListItem from './TaskListItem';

const listStyle = {
  listStyleType: 'none',
  padding: 0,
  marginTop: '20px',
};

const TaskList = ({ tasks, onEditTask, onDeleteTask }) => {
  if (!tasks || tasks.length === 0) {
    return null;
  }

  return (
    <ul style={listStyle}>
      {tasks.map((task, index) => (
        <TaskListItem
          key={task.id || `task-fallback-${index}`}
          task={task}
          onEditClick={onEditTask}
          onDeleteClick={onDeleteTask}
        />
      ))}
    </ul>
  );
};

export default TaskList;
