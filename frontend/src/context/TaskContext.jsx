import {
  createContext,
  useState,
  useCallback,
  useContext,
  useRef,
} from 'react';
import {
  getTasksForProjectAPI,
  createTaskInProjectAPI,
  updateTaskAPI,
  deleteTaskAPI,
  patchTaskAPI, // Import the new function
} from '@/services/taskApiService';
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
  const isFetching = useRef(false); // Ref to prevent re-entrant calls

  const fetchTasks = useCallback(
    async (projectId) => {
      if (!projectId) {
        setTasks([]);
        setCurrentProjectIdForTasks(null);
        return;
      }

      if (isFetching.current || !isAuthenticated || !token) {
        return;
      }

      isFetching.current = true;
      setIsLoadingTasks(true);
      setTaskError(null);
      setCurrentProjectIdForTasks(projectId);

      try {
        const fetchedTasks = await getTasksForProjectAPI(projectId);
        setTasks(fetchedTasks);
      } catch (err) {
        if (err.isSuppressed) return;
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
        isFetching.current = false;
      }
    },
    [token, isAuthenticated, showErrorToast]
  );

  const clearTasks = useCallback(() => {
    setTasks([]);

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

      try {
        const newTask = await createTaskInProjectAPI(projectId, taskData);

        // Add the new task to the current tasks if we're viewing the same project
        if (currentProjectIdForTasks === projectId) {
          setTasks((prevTasks) => [...prevTasks, newTask]);
        }
        return newTask; // Return the new task on success
      } catch (err) {
        // On failure, show a toast but do not set a page-level error.
        if (err.processedError) {
          showErrorToast(err.processedError);
        } else {
          const fallbackMessage = 'Failed to create task. Please try again.';
          showErrorToast({ message: fallbackMessage, severity: 'medium' });
        }
        throw err; // Re-throw so the form can handle it
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

      // No loading indicator for this action to keep UI responsive
      // setTaskError(null); // Don't clear page-level errors for this

      try {
        const updatedTask = await updateTaskAPI(taskId, taskData);

        // Update the task in local state
        setTasks((prevTasks) =>
          prevTasks.map((task) =>
            task.id === taskId ? { ...task, ...updatedTask } : task
          )
        );
      } catch (err) {
        // On failure, show a toast but do not set a page-level error.
        if (err.processedError) {
          showErrorToast(err.processedError);
        } else {
          const fallbackMessage = 'Failed to update task. Please try again.';
          showErrorToast({ message: fallbackMessage, severity: 'medium' });
        }
        // Re-throw so the calling component can react (e.g., stop a loading spinner)
        throw err;
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
        await deleteTaskAPI(taskId);

        // Remove the task from local state on successful deletion
        setTasks((prevTasks) => prevTasks.filter((task) => task.id !== taskId));
      } catch (err) {
        // On failure, show a toast but do not set a page-level error.
        // This prevents the task list from disappearing on a failed delete.
        if (err.processedError) {
          showErrorToast(err.processedError);
        } else {
          const fallbackMessage = 'Failed to delete task. Please try again.';
          showErrorToast({ message: fallbackMessage, severity: 'medium' });
        }
        throw err; // Re-throw so the component/modal can handle it
      } finally {
        setIsLoadingTasks(false);
      }
    },
    [token, isAuthenticated, showErrorToast]
  );
  // ... other state and hooks

  const patchTask = useCallback(
    async (taskId, partialTaskData) => {
      if (!taskId || !partialTaskData) return;

      if (!isAuthenticated || !token) {
        return;
      }

      // Use a local variable to hold the original state.
      let originalTasks;

      // Use the functional form of setTasks to get the current state
      // without needing `tasks` in the dependency array.
      setTasks((currentTasks) => {
        originalTasks = JSON.parse(JSON.stringify(currentTasks));
        return currentTasks.map((task) =>
          task.id === taskId ? { ...task, ...partialTaskData } : task
        );
      });

      try {
        const updatedTaskFromServer = await patchTaskAPI(
          taskId,
          partialTaskData
        );
        // Sync with the final state from the server
        setTasks((prevTasks) =>
          prevTasks.map((task) =>
            task.id === taskId ? updatedTaskFromServer : task
          )
        );
      } catch (err) {
        // On failure, revert to original state and show error
        setTasks(originalTasks); // Use the captured original state
        if (err.processedError) {
          showErrorToast(err.processedError);
        } else {
          const fallbackMessage = 'Failed to update task. Please try again.';
          showErrorToast({ message: fallbackMessage, severity: 'medium' });
        }
      }
    },
    [showErrorToast, token, isAuthenticated]
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
        patchTask,
      }}
    >
      {children}
    </TaskContext.Provider>
  );
};

export default TaskContext;
