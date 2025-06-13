import { useState, useEffect, useContext } from 'react';
import TaskContext from '../../context/TaskContext';
import { Button } from '@/components/ui/button';
import {
  Dialog,
  DialogContent,
  DialogDescription,
  DialogFooter,
  DialogHeader,
  DialogTitle,
} from '@/components/ui/dialog';
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

const EditTaskModal = ({ task, isOpen, onClose }) => {
  const [formData, setFormData] = useState({
    title: '',
    description: '',
    due_date: '',
    priority: 2,
  });
  const [error, setError] = useState('');
  const { updateTask, isLoadingTasks } = useContext(TaskContext);

  useEffect(() => {
    // Pre-fill form when task data changes (e.g., when modal opens for a specific task)
    if (task) {
      setFormData({
        title: task.title || '',
        description: task.description || '',
        due_date: task.due_date || '',
        priority: task.priority || 2,
      });
    }
  }, [task]);

  const validateForm = () => {
    // Whitespace-only title validation
    if (formData.title && !formData.title.trim()) {
      setError('Task title cannot be empty or contain only spaces.');
      return false;
    }

    // Past date validation
    if (formData.due_date) {
      const selectedDate = new Date(formData.due_date);
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

    if (!validateForm()) {
      return;
    }

    try {
      const taskData = {
        title: formData.title.trim(),
        description: formData.description.trim() || null,
        due_date: formData.due_date || null,
        priority: parseInt(formData.priority),
      };

      await updateTask(task.id, taskData);
      onClose();
    } catch (err) {
      console.error('Update task error:', err);
      setError('Failed to update task. Please try again.');
    }
  };

  const handleChange = (e) => {
    setFormData({
      ...formData,
      [e.target.name]: e.target.value,
    });
  };

  const onSelectChange = (value) => {
    setFormData({ ...formData, priority: parseInt(value) });
  };

  return (
    <Dialog open={isOpen} onOpenChange={(open) => !isLoadingTasks && onClose(open)}>
      <DialogContent className="sm:max-w-[425px] solid-popover-bg">
        <DialogHeader>
          <DialogTitle>Edit Task</DialogTitle>
          <DialogDescription>
            Make changes to your task here. Click save when you{'\''}re done.
          </DialogDescription>
        </DialogHeader>
        <form onSubmit={handleSubmit}>
          <div className="flex flex-col gap-6 py-4">
            {error ? (
              <div className="text-sm text-destructive bg-destructive/10 p-3 rounded-md">
                {error}
              </div>
            ) : null}

            <div className="grid gap-3">
              <Label htmlFor="editTaskTitle">Task Title</Label>
              <Input
                id="editTaskTitle"
                name="title"
                type="text"
                value={formData.title}
                onChange={handleChange}
                placeholder="e.g., Review project proposal, Fix login bug"
                required
                disabled={isLoadingTasks}
                maxLength={255}
              />
            </div>

            <div className="grid gap-3">
              <Label htmlFor="editTaskDescription">Description (optional)</Label>
              <Textarea
                id="editTaskDescription"
                name="description"
                value={formData.description}
                onChange={handleChange}
                placeholder="Add more details about this task..."
                disabled={isLoadingTasks}
                rows={3}
                className="resize-y"
              />
            </div>

            <div className="grid gap-3">
              <Label htmlFor="editTaskDueDate">Due Date (optional)</Label>
              <Input
                id="editTaskDueDate"
                name="due_date"
                type="date"
                value={formData.due_date}
                onChange={handleChange}
                disabled={isLoadingTasks}
              />
            </div>

            <div className="grid gap-3">
              <Label htmlFor="editTaskPriority">Priority</Label>
              <Select
                value={formData.priority.toString()}
                onValueChange={onSelectChange}
                disabled={isLoadingTasks}
              >
                <SelectTrigger aria-label="Priority">
                  <SelectValue placeholder="Select priority" />
                </SelectTrigger>
                <SelectContent className="solid-popover-bg">
                  <SelectItem value="1">Low</SelectItem>
                  <SelectItem value="2">Medium</SelectItem>
                  <SelectItem value="3">High</SelectItem>
                </SelectContent>
              </Select>
            </div>
          </div>
          <DialogFooter>
            <Button type="submit" disabled={isLoadingTasks}>
              {isLoadingTasks ? 'Saving...' : 'Save Changes'}
            </Button>
            <Button
              type="button"
              variant="outline"
              onClick={onClose}
              disabled={isLoadingTasks}
            >
              Cancel
            </Button>
          </DialogFooter>
        </form>
      </DialogContent>
    </Dialog>
  );
};

export default EditTaskModal;
