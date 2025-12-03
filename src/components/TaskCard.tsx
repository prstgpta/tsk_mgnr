import { useState } from 'react';
import { Trash2, CheckCircle, Clock, AlertCircle, ChevronDown, ChevronUp, Wand2, Plus } from 'lucide-react';
import { supabase } from '../lib/supabase';

interface Subtask {
  id: string;
  title: string;
  status: 'pending' | 'in-progress' | 'done';
}

interface TaskCardProps {
  task: {
    id: string;
    title: string;
    priority: 'low' | 'medium' | 'high';
    status: 'pending' | 'in-progress' | 'done';
  };
  subtasks: Subtask[];
  onStatusChange: (id: string, status: 'pending' | 'in-progress' | 'done') => void;
  onPriorityChange: (id: string, priority: 'low' | 'medium' | 'high') => void;
  onDeleteTask: (id: string) => void;
  onSubtasksLoad: () => void;
  userId: string;
}

export default function TaskCard({
  task,
  subtasks,
  onStatusChange,
  onPriorityChange,
  onDeleteTask,
  onSubtasksLoad,
  userId,
}: TaskCardProps) {
  const [expanded, setExpanded] = useState(false);
  const [generating, setGenerating] = useState(false);
  const [suggestions, setSuggestions] = useState<string[]>([]);
  const [error, setError] = useState('');

  const getStatusIcon = (status: string) => {
    switch (status) {
      case 'done':
        return <CheckCircle size={20} className="text-green-500" />;
      case 'in-progress':
        return <Clock size={20} className="text-yellow-500" />;
      default:
        return <AlertCircle size={20} className="text-gray-400" />;
    }
  };

  const getPriorityColor = (priority: string) => {
    switch (priority) {
      case 'high':
        return 'bg-red-100 text-red-800 border-red-300';
      case 'medium':
        return 'bg-yellow-100 text-yellow-800 border-yellow-300';
      default:
        return 'bg-green-100 text-green-800 border-green-300';
    }
  };

  const getStatusColor = (status: string) => {
    switch (status) {
      case 'done':
        return 'bg-green-100 text-green-800 border-green-300';
      case 'in-progress':
        return 'bg-blue-100 text-blue-800 border-blue-300';
      default:
        return 'bg-gray-100 text-gray-800 border-gray-300';
    }
  };

  const getSubtaskStatusColor = (status: string) => {
    switch (status) {
      case 'done':
        return 'bg-green-50 border-green-200';
      case 'in-progress':
        return 'bg-blue-50 border-blue-200';
      default:
        return 'bg-gray-50 border-gray-200';
    }
  };

  const handleGenerateSubtasks = async () => {
    setGenerating(true);
    setError('');
    setSuggestions([]);

    try {
      const supabaseUrl = import.meta.env.VITE_SUPABASE_URL;
      const anonKey = import.meta.env.VITE_SUPABASE_ANON_KEY;

      const response = await fetch(
        `${supabaseUrl}/functions/v1/generate-subtasks`,
        {
          method: 'POST',
          headers: {
            'Content-Type': 'application/json',
            Authorization: `Bearer ${anonKey}`,
          },
          body: JSON.stringify({ taskTitle: task.title }),
        }
      );

      if (!response.ok) {
        throw new Error('Failed to generate subtasks');
      }

      const data = await response.json();
      setSuggestions(data.subtasks || []);
    } catch (err) {
      setError('Failed to generate subtasks. Please try again.');
    } finally {
      setGenerating(false);
    }
  };

  const handleSaveSubtask = async (subtaskTitle: string) => {
    try {
      const { error } = await supabase.from('subtasks').insert([
        {
          task_id: task.id,
          user_id: userId,
          title: subtaskTitle,
          status: 'pending',
        },
      ]);

      if (error) throw error;

      setSuggestions(suggestions.filter((s) => s !== subtaskTitle));
      onSubtasksLoad();
    } catch (err) {
      setError('Failed to save subtask');
    }
  };

  const handleDeleteSubtask = async (subtaskId: string) => {
    try {
      const { error } = await supabase.from('subtasks').delete().eq('id', subtaskId);

      if (error) throw error;

      onSubtasksLoad();
    } catch (err) {
      setError('Failed to delete subtask');
    }
  };

  const handleSubtaskStatusChange = async (subtaskId: string, newStatus: 'pending' | 'in-progress' | 'done') => {
    try {
      const { error } = await supabase
        .from('subtasks')
        .update({ status: newStatus })
        .eq('id', subtaskId);

      if (error) throw error;

      onSubtasksLoad();
    } catch (err) {
      setError('Failed to update subtask');
    }
  };

  return (
    <div className="flex flex-col gap-4 p-4 bg-gray-50 rounded-lg border-l-4 border-blue-600 hover:bg-gray-100 transition-colors">
      <div className="flex flex-col md:flex-row md:items-center md:justify-between gap-4">
        <div className="flex items-center gap-3 flex-1 min-w-0">
          {getStatusIcon(task.status)}
          <span className="text-lg text-gray-800 font-medium truncate">• {task.title}</span>
        </div>

        <div className="flex flex-col sm:flex-row gap-3 items-start sm:items-center">
          <select
            value={task.priority}
            onChange={(e) => onPriorityChange(task.id, e.target.value as 'low' | 'medium' | 'high')}
            className={`px-3 py-2 rounded-full border-2 text-sm font-medium cursor-pointer transition-colors ${getPriorityColor(task.priority)}`}
          >
            <option value="low">Low</option>
            <option value="medium">Medium</option>
            <option value="high">High</option>
          </select>

          <select
            value={task.status}
            onChange={(e) => onStatusChange(task.id, e.target.value as 'pending' | 'in-progress' | 'done')}
            className={`px-3 py-2 rounded-full border-2 text-sm font-medium cursor-pointer transition-colors ${getStatusColor(task.status)}`}
          >
            <option value="pending">Pending</option>
            <option value="in-progress">In-progress</option>
            <option value="done">Done</option>
          </select>

          <button
            onClick={() => setExpanded(!expanded)}
            className="text-blue-600 hover:text-blue-800 transition-colors flex-shrink-0"
            aria-label="Toggle subtasks"
          >
            {expanded ? <ChevronUp size={20} /> : <ChevronDown size={20} />}
          </button>

          <button
            onClick={() => onDeleteTask(task.id)}
            className="text-red-500 hover:text-red-700 hover:scale-110 transition-all duration-200 flex-shrink-0"
            aria-label="Delete task"
          >
            <Trash2 size={20} />
          </button>
        </div>
      </div>

      {expanded && (
        <div className="mt-2 pt-4 border-t space-y-4">
          {error && (
            <div className="p-3 bg-red-100 border border-red-400 text-red-700 rounded-lg text-sm">
              {error}
            </div>
          )}

          {subtasks.length > 0 && (
            <div className="space-y-2">
              <p className="text-sm font-semibold text-gray-700">Subtasks:</p>
              <div className="space-y-2">
                {subtasks.map((subtask) => (
                  <div
                    key={subtask.id}
                    className={`flex items-center justify-between gap-3 p-3 rounded-lg border-2 ${getSubtaskStatusColor(subtask.status)}`}
                  >
                    <span className="text-sm text-gray-700">○ {subtask.title}</span>
                    <div className="flex gap-2 items-center">
                      <select
                        value={subtask.status}
                        onChange={(e) => handleSubtaskStatusChange(subtask.id, e.target.value as 'pending' | 'in-progress' | 'done')}
                        className="px-2 py-1 text-xs rounded border border-gray-300 focus:outline-none focus:border-blue-600"
                      >
                        <option value="pending">Pending</option>
                        <option value="in-progress">In-progress</option>
                        <option value="done">Done</option>
                      </select>
                      <button
                        onClick={() => handleDeleteSubtask(subtask.id)}
                        className="text-red-500 hover:text-red-700 transition-colors"
                        aria-label="Delete subtask"
                      >
                        <Trash2 size={16} />
                      </button>
                    </div>
                  </div>
                ))}
              </div>
            </div>
          )}

          <button
            onClick={handleGenerateSubtasks}
            disabled={generating}
            className="w-full flex items-center justify-center gap-2 px-4 py-2 bg-gradient-to-r from-blue-500 to-blue-600 text-white rounded-lg text-sm font-semibold hover:from-blue-600 hover:to-blue-700 transition-all duration-200 disabled:opacity-50 disabled:cursor-not-allowed"
          >
            <Wand2 size={18} />
            {generating ? 'Generating...' : 'Generate Subtasks with AI'}
          </button>

          {suggestions.length > 0 && (
            <div className="space-y-2">
              <p className="text-sm font-semibold text-gray-700">AI Suggestions:</p>
              <div className="space-y-2">
                {suggestions.map((suggestion, idx) => (
                  <div
                    key={idx}
                    className="flex items-center justify-between gap-3 p-3 bg-amber-50 border-2 border-amber-200 rounded-lg"
                  >
                    <span className="text-sm text-gray-700 flex-1">◆ {suggestion}</span>
                    <button
                      onClick={() => handleSaveSubtask(suggestion)}
                      className="flex items-center gap-1 px-3 py-1 bg-green-600 text-white text-xs font-semibold rounded hover:bg-green-700 transition-colors flex-shrink-0"
                    >
                      <Plus size={14} />
                      Save
                    </button>
                  </div>
                ))}
              </div>
            </div>
          )}
        </div>
      )}
    </div>
  );
}
