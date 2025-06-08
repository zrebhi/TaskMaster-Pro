import { createContext, useState, useCallback, useContext } from 'react';
import {
  getTasksForProjectAPI,
  createTaskInProjectAPI,
  updateTaskDetails,
  deleteTaskById,
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

  const updateTask = useCallback(
    async (taskId, taskData) => {
      if (!taskId || !taskData) {
        return;
      }

      if (!isAuthenticated || !token) {
        const fallbackMessage = 'Authentication required to update tasks.';
        showErrorToast({ message: fallbackMessage, severity: 'medium' });
        return;
      }

      setIsLoadingTasks(true);
      setTaskError(null);

      try {
        const updatedTask = await updateTaskDetails(taskId, taskData);

        // Update the task in local state
        setTasks((prevTasks) =>
          prevTasks.map((task) =>
            task.id === taskId ? { ...task, ...updatedTask } : task
          )
        );
      } catch (err) {
        if (err.processedError) {
          showErrorToast(err.processedError);
          setTaskError(err.processedError.message);
        } else {
          const fallbackMessage = 'Failed to update task. Please try again.';
          showErrorToast({ message: fallbackMessage, severity: 'medium' });
          setTaskError(fallbackMessage);
        }
        throw err; // Re-throw so the component can handle it
      } finally {
        setIsLoadingTasks(false);
      }
    },
    [token, isAuthenticated, showErrorToast]
  );

  const deleteTask = useCallback(
    async (taskId) => {
      if (!taskId) {
        return;
      }

      if (!isAuthenticated || !token) {
        const fallbackMessage = 'Authentication required to delete tasks.';
        showErrorToast({ message: fallbackMessage, severity: 'medium' });
        return;
      }

      setIsLoadingTasks(true);
      setTaskError(null);

      try {
        await deleteTaskById(taskId);

        // Remove the task from local state
        setTasks((prevTasks) => prevTasks.filter((task) => task.id !== taskId));
      } catch (err) {
        if (err.processedError) {
          showErrorToast(err.processedError);
          setTaskError(err.processedError.message);
        } else {
          const fallbackMessage = 'Failed to delete task. Please try again.';
          showErrorToast({ message: fallbackMessage, severity: 'medium' });
          setTaskError(fallbackMessage);
        }
        throw err; // Re-throw so the component can handle it
      } finally {
        setIsLoadingTasks(false);
      }
    },
    [token, isAuthenticated, showErrorToast]
  );

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
