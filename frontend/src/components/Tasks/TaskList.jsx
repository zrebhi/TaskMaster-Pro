import TaskListItem from './TaskListItem';

const listStyle = {
  listStyleType: 'none',
  padding: 0,
  marginTop: '20px',
};

const TaskList = ({ tasks }) => {
  if (!tasks || tasks.length === 0) {
    return null;
  }

  return (
    <ul style={listStyle}>
      {tasks.map((task) => (
        <TaskListItem key={task.id} task={task} />
      ))}
    </ul>
  );
};

export default TaskList;
