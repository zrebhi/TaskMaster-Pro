// src/components/Tasks/TaskForm.jsx

import { useState, useEffect } from 'react';
import { cn, getToday } from '@/lib/utils';
import { Button } from '@/components/ui/button';
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

const DEFAULT_FORM_STATE = {
  title: '',
  description: '',
  due_date: '',
  priority: 2,
};

/**
 * A reusable form for creating or editing a task.
 * @param {object} props
 * @param {object} [props.initialData] - The initial data to populate the form for editing.
 * @param {function} props.onSubmit - The function to call with the form data on submission.
 * @param {boolean} props.isLoading - Whether a submission is in progress.
 * @param {string} [props.submitButtonText="Submit"] - The text for the submit button.
 * @param {string} [props.loadingButtonText="Submitting..."] - The text for the submit button when loading.
 */
const TaskForm = ({
  initialData,
  onSubmit,
  isLoading,
  submitButtonText = 'Submit',
  loadingButtonText = 'Submitting...',
  className,
  ...props
}) => {
  const [formData, setFormData] = useState(DEFAULT_FORM_STATE);
  const [error, setError] = useState('');

  useEffect(() => {
    // If initialData is provided (i.e., we are editing), populate the form.
    // Otherwise, ensure the form is reset to its default state.
    if (initialData) {
      setFormData({
        title: initialData.title || '',
        description: initialData.description || '',
        // Format date for the input field which expects YYYY-MM-DD
        due_date: initialData.due_date
          ? initialData.due_date.split('T')[0]
          : '',
        priority: initialData.priority || 2,
      });
    } else {
      setFormData(DEFAULT_FORM_STATE);
    }
  }, [initialData]); // This effect re-runs whenever the task being edited changes.

  const { title, description, due_date, priority } = formData;

  const handleChange = (e) => {
    setFormData({ ...formData, [e.target.name]: e.target.value });
  };

  const onSelectChange = (value) => {
    setFormData({ ...formData, priority: parseInt(value) });
  };

  const validateForm = () => {
    if (title && !title.trim()) {
      setError('Task title cannot be empty or contain only spaces.');
      return false;
    }
    if (due_date) {
      const selectedDate = new Date(due_date);
      const today = new Date();
      today.setHours(0, 0, 0, 0);
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
    if (!validateForm()) return;

    try {
      const taskData = {
        title: title.trim(),
        description: description.trim() || null,
        due_date: due_date || null,
        priority: parseInt(priority),
      };
      // The component doesn't know what the action is, it just calls the function from props.
      await onSubmit(taskData);
    } catch (err) {
      setError(err.message || 'An error occurred. Please try again.');
    }
  };

  return (
    <form
      onSubmit={handleSubmit}
      className={cn('flex flex-col gap-3', className)}
      {...props}
    >
      {!!error && (
        <div className="text-sm text-destructive bg-destructive/10 p-3 rounded-md">
          {error}
        </div>
      )}
      <div className="grid gap-3">
        <Label htmlFor="taskTitle">Task Title</Label>
        <Input
          id="taskTitle"
          name="title"
          type="text"
          placeholder="e.g., Review project proposal"
          value={title}
          onChange={handleChange}
          required
          disabled={isLoading}
          maxLength={255}
        />
      </div>
      <div className="grid gap-3">
        <Label htmlFor="taskDescription">Description (optional)</Label>
        <Textarea
          id="taskDescription"
          name="description"
          placeholder="Add more details about this task..."
          value={description}
          onChange={handleChange}
          disabled={isLoading}
          rows={4}
          className="resize-y"
        />
      </div>
      <div className="grid gap-3">
        <Label htmlFor="taskDueDate">Due Date (optional)</Label>
        <Input
          id="taskDueDate"
          name="due_date"
          type="date"
          value={due_date}
          onChange={handleChange}
          disabled={isLoading}
          min={getToday()} // Prevent past dates
        />
      </div>
      <div className="grid gap-3">
        <Label id="taskPriority" htmlFor="taskPriority">
          Priority
        </Label>
        <Select
          value={priority.toString()}
          onValueChange={onSelectChange}
          disabled={isLoading}
        >
          <SelectTrigger aria-labelledby="taskPriority">
            <SelectValue placeholder="Select priority" />
          </SelectTrigger>
          <SelectContent>
            <SelectItem value="1">Low</SelectItem>
            <SelectItem value="2">Medium</SelectItem>
            <SelectItem value="3">High</SelectItem>
          </SelectContent>
        </Select>
      </div>
      <Button type="submit" className="w-full" disabled={isLoading}>
        {isLoading ? loadingButtonText : submitButtonText}
      </Button>
    </form>
  );
};

export default TaskForm;
