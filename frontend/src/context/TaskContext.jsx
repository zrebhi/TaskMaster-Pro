import { createContext, useState, useCallback } from 'react';
import { getTasksForProjectAPI } from '../services/taskApiService';
import { useError } from './ErrorContext';

const TaskContext = createContext(null);

export const TaskProvider = ({ children }) => {
  const [tasks, setTasks] = useState([]);
  const [isLoadingTasks, setIsLoadingTasks] = useState(false);
  const [taskError, setTaskError] = useState(null);
  const [currentProjectIdForTasks, setCurrentProjectIdForTasks] =
    useState(null);

  const { showErrorToast } = useError();

  const fetchTasks = useCallback(
    async (projectId) => {
      if (!projectId) {
        setTasks([]);
        setCurrentProjectIdForTasks(null);
        return;
      }

      setIsLoadingTasks(true);
      setTaskError(null);
      setCurrentProjectIdForTasks(projectId);

      try {
        const fetchedTasks = await getTasksForProjectAPI(projectId);
        setTasks(fetchedTasks);
      } catch (err) {
        if (err.processedError) {
          showErrorToast(err.processedError);
          setTaskError(err.processedError.message);
        } else {
          const fallbackMessage = 'Failed to fetch tasks for the project.';
          showErrorToast({ message: fallbackMessage, severity: 'medium' });
          setTaskError(fallbackMessage);
        }
        setTasks([]);
      } finally {
        setIsLoadingTasks(false);
      }
    },
    [showErrorToast]
  );

  const clearTasks = useCallback(() => {
    setTasks([]);
    setCurrentProjectIdForTasks(null);
    setTaskError(null);
  }, []);

  // Placeholder functions for future implementation
  const addTask = async (_projectId, _taskData) => {
    // To be implemented in next sub-feature
  };

  const updateTask = async (_taskId, _taskData) => {
    // To be implemented in future sub-feature
  };

  const deleteTask = async (_taskId) => {
    // To be implemented in future sub-feature
  };

  return (
    <TaskContext.Provider
      value={{
        tasks,
        isLoadingTasks,
        taskError,
        fetchTasks,
        addTask,
        updateTask,
        deleteTask,
        currentProjectIdForTasks,
        clearTasks,
      }}
    >
      {children}
    </TaskContext.Provider>
  );
};

export default TaskContext;
