import { useState, useEffect } from 'react';
import { useNavigate } from 'react-router-dom';
import { Trash2, CheckCircle, Clock, AlertCircle } from 'lucide-react';
import { supabase } from '../lib/supabase';

interface Task {
  id: string;
  title: string;
  priority: 'low' | 'medium' | 'high';
  status: 'pending' | 'in-progress' | 'done';
}

export default function Dashboard() {
  const navigate = useNavigate();
  const [tasks, setTasks] = useState<Task[]>([]);
  const [newTask, setNewTask] = useState('');
  const [newPriority, setNewPriority] = useState<'low' | 'medium' | 'high'>('medium');
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState('');
  const [userId, setUserId] = useState<string | null>(null);

  useEffect(() => {
    const checkAuthAndLoadTasks = async () => {
      try {
        const { data } = await supabase.auth.getSession();
        if (!data.session) {
          navigate('/login');
          return;
        }

        setUserId(data.session.user.id);
        await loadTasks(data.session.user.id);
      } catch (err) {
        setError('Failed to load tasks');
      } finally {
        setLoading(false);
      }
    };

    checkAuthAndLoadTasks();
  }, [navigate]);

  const loadTasks = async (uid: string) => {
    try {
      const { data, error } = await supabase
        .from('tasks')
        .select('*')
        .eq('user_id', uid)
        .order('created_at', { ascending: false });

      if (error) throw error;
      setTasks(data || []);
    } catch (err) {
      setError('Failed to load tasks');
    }
  };

  const handleAddTask = async () => {
    if (!newTask.trim() || !userId) return;

    try {
      const { error } = await supabase.from('tasks').insert([
        {
          user_id: userId,
          title: newTask,
          priority: newPriority,
          status: 'pending',
        },
      ]);

      if (error) throw error;

      setNewTask('');
      setNewPriority('medium');
      await loadTasks(userId);
    } catch (err) {
      setError('Failed to add task');
    }
  };

  const handleDeleteTask = async (id: string) => {
    if (!userId) return;

    try {
      const { error } = await supabase.from('tasks').delete().eq('id', id);

      if (error) throw error;

      await loadTasks(userId);
    } catch (err) {
      setError('Failed to delete task');
    }
  };

  const handleStatusChange = async (id: string, newStatus: 'pending' | 'in-progress' | 'done') => {
    if (!userId) return;

    try {
      const { error } = await supabase
        .from('tasks')
        .update({ status: newStatus })
        .eq('id', id);

      if (error) throw error;

      await loadTasks(userId);
    } catch (err) {
      setError('Failed to update task status');
    }
  };

  const handlePriorityChange = async (id: string, newPriority: 'low' | 'medium' | 'high') => {
    if (!userId) return;

    try {
      const { error } = await supabase
        .from('tasks')
        .update({ priority: newPriority })
        .eq('id', id);

      if (error) throw error;

      await loadTasks(userId);
    } catch (err) {
      setError('Failed to update task priority');
    }
  };

  const handleKeyPress = (e: React.KeyboardEvent) => {
    if (e.key === 'Enter') {
      handleAddTask();
    }
  };

  const handleLogout = async () => {
    await supabase.auth.signOut();
    navigate('/');
  };

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

  if (loading) {
    return (
      <div className="min-h-screen bg-gradient-to-br from-blue-400 via-blue-300 to-white flex items-center justify-center">
        <div className="text-white text-2xl font-semibold drop-shadow-lg">Loading...</div>
      </div>
    );
  }

  return (
    <div className="min-h-screen bg-gradient-to-br from-blue-400 via-blue-300 to-white px-4 py-8">
      <div className="max-w-3xl mx-auto">
        <h1 className="text-5xl md:text-6xl font-bold text-white drop-shadow-lg text-center mb-12">
          Your Tasks
        </h1>

        <div className="bg-white rounded-lg shadow-2xl p-8 space-y-8">
          {error && (
            <div className="p-4 bg-red-100 border border-red-400 text-red-700 rounded-lg">
              {error}
            </div>
          )}

          <div className="space-y-4">
            {tasks.length > 0 ? (
              <ul className="space-y-3">
                {tasks.map((task) => (
                  <li
                    key={task.id}
                    className="flex flex-col md:flex-row md:items-center md:justify-between gap-4 p-4 bg-gray-50 rounded-lg border-l-4 border-blue-600 hover:bg-gray-100 transition-colors"
                  >
                    <div className="flex items-center gap-3 flex-1 min-w-0">
                      {getStatusIcon(task.status)}
                      <span className="text-lg text-gray-800 font-medium truncate">
                        • {task.title}
                      </span>
                    </div>

                    <div className="flex flex-col sm:flex-row gap-3 items-start sm:items-center">
                      <select
                        value={task.priority}
                        onChange={(e) => handlePriorityChange(task.id, e.target.value as 'low' | 'medium' | 'high')}
                        className={`px-3 py-2 rounded-full border-2 text-sm font-medium cursor-pointer transition-colors ${getPriorityColor(task.priority)}`}
                      >
                        <option value="low">Low</option>
                        <option value="medium">Medium</option>
                        <option value="high">High</option>
                      </select>

                      <select
                        value={task.status}
                        onChange={(e) => handleStatusChange(task.id, e.target.value as 'pending' | 'in-progress' | 'done')}
                        className={`px-3 py-2 rounded-full border-2 text-sm font-medium cursor-pointer transition-colors ${getStatusColor(task.status)}`}
                      >
                        <option value="pending">Pending</option>
                        <option value="in-progress">In-progress</option>
                        <option value="done">Done</option>
                      </select>

                      <button
                        onClick={() => handleDeleteTask(task.id)}
                        className="text-red-500 hover:text-red-700 hover:scale-110 transition-all duration-200 flex-shrink-0"
                        aria-label="Delete task"
                      >
                        <Trash2 size={20} />
                      </button>
                    </div>
                  </li>
                ))}
              </ul>
            ) : (
              <p className="text-center text-gray-400 py-8">No tasks yet. Add one below!</p>
            )}
          </div>

          <div className="border-t pt-8 space-y-4">
            <label className="block text-lg font-semibold text-gray-700">
              New Task
            </label>
            <div className="flex flex-col md:flex-row gap-4">
              <input
                type="text"
                value={newTask}
                onChange={(e) => setNewTask(e.target.value)}
                onKeyPress={handleKeyPress}
                placeholder="Enter a new task..."
                className="flex-1 px-4 py-3 border-2 border-gray-300 rounded-lg focus:outline-none focus:border-blue-600 transition-colors text-lg"
              />
              <select
                value={newPriority}
                onChange={(e) => setNewPriority(e.target.value as 'low' | 'medium' | 'high')}
                className="px-4 py-3 border-2 border-gray-300 rounded-lg focus:outline-none focus:border-blue-600 transition-colors text-lg"
              >
                <option value="low">Low Priority</option>
                <option value="medium">Medium Priority</option>
                <option value="high">High Priority</option>
              </select>
              <button
                onClick={handleAddTask}
                className="px-8 py-3 bg-blue-600 text-white rounded-lg text-lg font-semibold shadow-lg hover:shadow-xl hover:bg-blue-700 transition-all duration-200 whitespace-nowrap"
              >
                Add Task
              </button>
            </div>
          </div>

          <div className="border-t pt-8">
            <button
              onClick={handleLogout}
              className="w-full px-8 py-4 bg-white text-blue-600 rounded-lg text-xl font-semibold shadow-lg hover:shadow-xl hover:scale-105 transition-all duration-200 border-2 border-blue-600"
            >
              Logout
            </button>
          </div>
        </div>
      </div>
    </div>
  );
}
