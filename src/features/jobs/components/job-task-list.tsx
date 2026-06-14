import { useState, useRef } from "react";
import { Checkbox } from "@/components/ui/checkbox";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Trash2, Plus } from "lucide-react";
import { toast } from "sonner";
import { useToggleJobTask, useAddJobTask, useDeleteJobTask } from "../hooks";
import { jobProgress } from "../schemas";
import type { JobTask } from "@/db/schema";

interface JobTaskListProps {
  jobId: string;
  tasks: JobTask[];
}

export default function JobTaskList({ jobId, tasks }: JobTaskListProps) {
  const [newTaskTitle, setNewTaskTitle] = useState("");
  const [adding, setAdding] = useState(false);
  const inputRef = useRef<HTMLInputElement>(null);

  const toggleTask = useToggleJobTask(jobId);
  const addTask = useAddJobTask(jobId);
  const deleteTask = useDeleteJobTask(jobId);

  const progress = jobProgress(tasks);

  const handleToggle = (task: JobTask) => {
    toggleTask.mutate(
      { taskId: task.id, jobId, isCompleted: !task.isCompleted },
      {
        onError: (err: Error) => toast.error(`Error: ${err.message}`),
      },
    );
  };

  const handleAddTask = () => {
    const title = newTaskTitle.trim();
    if (!title) return;
    addTask.mutate(
      { jobId, title, sortOrder: tasks.length },
      {
        onSuccess: () => {
          setNewTaskTitle("");
          setAdding(false);
        },
        onError: (err: Error) => toast.error(`Error: ${err.message}`),
      },
    );
  };

  const handleDeleteTask = (task: JobTask) => {
    deleteTask.mutate(
      { taskId: task.id, jobId },
      {
        onError: (err: Error) => toast.error(`Error: ${err.message}`),
      },
    );
  };

  return (
    <div className="space-y-3">
      {/* Progress */}
      <div className="flex items-center gap-3">
        <div className="flex-1 bg-muted rounded-full h-2">
          <div
            className="bg-primary rounded-full h-2 transition-all"
            style={{ width: `${progress}%` }}
          />
        </div>
        <span className="text-sm text-muted-foreground w-10 text-right">
          {progress}%
        </span>
      </div>

      {/* Task list */}
      <div className="space-y-1">
        {tasks.map((task) => (
          <div
            key={task.id}
            className="group flex items-center gap-3 py-2 px-3 rounded-md hover:bg-muted/50">
            <Checkbox
              id={task.id}
              checked={task.isCompleted}
              onCheckedChange={() => handleToggle(task)}
              disabled={toggleTask.isPending}
            />
            <label
              htmlFor={task.id}
              className={`flex-1 text-sm cursor-pointer ${task.isCompleted ? "line-through text-muted-foreground" : ""}`}>
              {task.title}
            </label>
            <Button
              variant="ghost"
              size="icon"
              className="h-7 w-7 opacity-0 group-hover:opacity-100 transition-opacity text-muted-foreground hover:text-destructive"
              onClick={() => handleDeleteTask(task)}
              disabled={deleteTask.isPending}>
              <Trash2 className="h-3.5 w-3.5" />
              <span className="sr-only">Delete task</span>
            </Button>
          </div>
        ))}
      </div>

      {/* Add task */}
      {adding ? (
        <div className="flex gap-2 items-center px-3">
          <Input
            ref={inputRef}
            autoFocus
            placeholder="Task title..."
            value={newTaskTitle}
            onChange={(e) => setNewTaskTitle(e.target.value)}
            onKeyDown={(e) => {
              if (e.key === "Enter") handleAddTask();
              if (e.key === "Escape") {
                setAdding(false);
                setNewTaskTitle("");
              }
            }}
            className="h-8 text-sm"
          />
          <Button
            size="sm"
            onClick={handleAddTask}
            disabled={!newTaskTitle.trim() || addTask.isPending}>
            {addTask.isPending ? "..." : "Add"}
          </Button>
          <Button
            size="sm"
            variant="ghost"
            onClick={() => {
              setAdding(false);
              setNewTaskTitle("");
            }}>
            Cancel
          </Button>
        </div>
      ) : (
        <Button
          variant="ghost"
          size="sm"
          className="text-muted-foreground hover:text-foreground px-3"
          onClick={() => {
            setAdding(true);
            setTimeout(() => inputRef.current?.focus(), 0);
          }}>
          <Plus className="h-4 w-4 mr-1" />
          Add task
        </Button>
      )}
    </div>
  );
}
