import { createContext, useState, useCallback, useContext } from 'react';
import {
  getTasksForProjectAPI,
  createTaskInProjectAPI,
} from '../services/taskApiService';
import { useError } from './ErrorContext';
import AuthContext from './AuthContext';

const TaskContext = createContext(null);

export const TaskProvider = ({ children }) => {
  const [tasks, setTasks] = useState([]);
  const [isLoadingTasks, setIsLoadingTasks] = useState(false);
  const [taskError, setTaskError] = useState(null);
  const [currentProjectIdForTasks, setCurrentProjectIdForTasks] =
    useState(null);

  const { showErrorToast } = useError();
  const { token, isAuthenticated } = useContext(AuthContext);

  const fetchTasks = useCallback(
    async (projectId) => {
      if (!projectId) {
        setTasks([]);
        setCurrentProjectIdForTasks(null);
        return;
      }

      if (!isAuthenticated || !token) {
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
    [token, isAuthenticated, showErrorToast]
  );

  const clearTasks = useCallback(() => {
    setTasks([]);
    setCurrentProjectIdForTasks(null);
    setTaskError(null);
  }, []);

  const addTask = useCallback(
    async (projectId, taskData) => {
      if (!projectId || !taskData) {
        return;
      }

      if (!isAuthenticated || !token) {
        const fallbackMessage = 'Authentication required to create tasks.';
        showErrorToast({ message: fallbackMessage, severity: 'medium' });
        return;
      }

      setIsLoadingTasks(true);
      setTaskError(null);

      try {
        const newTask = await createTaskInProjectAPI(projectId, taskData);

        // Optimistic update: add the new task to the current tasks if we're viewing the same project
        if (currentProjectIdForTasks === projectId) {
          setTasks((prevTasks) => [...prevTasks, newTask]);
        }
      } catch (err) {
        if (err.processedError) {
          showErrorToast(err.processedError);
          setTaskError(err.processedError.message);
        } else {
          const fallbackMessage = 'Failed to create task. Please try again.';
          showErrorToast({ message: fallbackMessage, severity: 'medium' });
          setTaskError(fallbackMessage);
        }
        throw err; // Re-throw so the form can handle it
      } finally {
        setIsLoadingTasks(false);
      }
    },
    [token, isAuthenticated, showErrorToast, currentProjectIdForTasks]
  );

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
