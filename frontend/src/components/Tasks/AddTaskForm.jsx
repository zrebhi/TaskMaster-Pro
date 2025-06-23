import { useState, useContext } from 'react';
import TaskContext from '../../context/TaskContext';
import { cn } from '@/lib/utils';
import { Button } from '@/components/ui/button';
import {
} from '@/components/ui/card';
import { Input } from '@/components/ui/input';
import { Label } from '@/components/ui/label';
import { Textarea } from '@/components/ui/textarea';
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from '@/components/ui/select';

const AddTaskForm = ({ projectId, className, onTaskAdded, ...props }) => {
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

  const onSelectChange = (value) => {
    setFormData({ ...formData, priority: parseInt(value) });
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
      if (onTaskAdded) {
        onTaskAdded();
      }
    } catch {
      setError('Failed to create task. Please try again.');
    }
  };

  return (
    <form onSubmit={handleSubmit} className={cn('pt-4', className)} {...props}>
      <div className="flex flex-col gap-6">
        {error ? <div className="text-sm text-destructive bg-destructive/10 p-3 rounded-md">
            {error}
          </div> : null}
        <div className="grid gap-3">
          <Label htmlFor="taskTitle">Task Title</Label>
          <Input
            id="taskTitle"
            name="title"
            type="text"
            placeholder="e.g., Review project proposal, Fix login bug"
            value={title}
            onChange={onChange}
            required
            disabled={isLoadingTasks}
            maxLength={255}
          />
        </div>
        <div className="grid gap-3">
          <Label htmlFor="taskDueDate">Due Date (optional)</Label>
          <Input
            id="taskDueDate"
            name="due_date"
            type="date"
            value={due_date}
            onChange={onChange}
            disabled={isLoadingTasks}
          />
        </div>
        <div className="grid gap-3">
          <Label htmlFor="taskDescription">Description (optional)</Label>
          <Textarea
            id="taskDescription"
            name="description"
            placeholder="Add more details about this task..."
            value={description}
            onChange={onChange}
            disabled={isLoadingTasks}
            rows={3}
            className="resize-y"
          />
        </div>
        <div className="grid gap-3">
          <Label id="taskPriority" htmlFor="taskPriority">Priority</Label>
          {/* <CustomSelect /> */}
          <Select
            value={priority.toString()}
            onValueChange={onSelectChange}
            disabled={isLoadingTasks}
          >
            <SelectTrigger aria-labelledby="taskPriority">
              <SelectValue placeholder="Select priority" />
            </SelectTrigger>
            <SelectContent className="solid-popover-bg">
              <SelectItem value="1">Low</SelectItem>
              <SelectItem value="2">Medium</SelectItem>
              <SelectItem value="3">High</SelectItem>
            </SelectContent>
          </Select>
        </div>
        <Button type="submit" className="w-full" disabled={isLoadingTasks}>
          {isLoadingTasks ? 'Creating...' : 'Create Task'}
        </Button>
      </div>
    </form>
  );
};

export default AddTaskForm;
