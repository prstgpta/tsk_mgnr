import { useState, useEffect } from 'react';
import { useNavigate } from 'react-router-dom';
import { supabase } from '../lib/supabase';
import TaskCard from '../components/TaskCard';

interface Task {
  id: string;
  title: string;
  priority: 'low' | 'medium' | 'high';
  status: 'pending' | 'in-progress' | 'done';
}

interface Subtask {
  id: string;
  task_id: string;
  title: string;
  status: 'pending' | 'in-progress' | 'done';
}

export default function Dashboard() {
  const navigate = useNavigate();
  const [tasks, setTasks] = useState<Task[]>([]);
  const [subtasks, setSubtasks] = useState<Subtask[]>([]);
  const [newTask, setNewTask] = useState('');
  const [newPriority, setNewPriority] = useState<'low' | 'medium' | 'high'>('medium');
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState('');
  const [userId, setUserId] = useState<string | null>(null);

  useEffect(() => {
    const checkAuthAndLoadData = async () => {
      try {
        const { data } = await supabase.auth.getSession();
        if (!data.session) {
          navigate('/login');
          return;
        }

        setUserId(data.session.user.id);
        await Promise.all([
          loadTasks(data.session.user.id),
          loadSubtasks(data.session.user.id),
        ]);
      } catch (err) {
        setError('Failed to load data');
      } finally {
        setLoading(false);
      }
    };

    checkAuthAndLoadData();
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

  const loadSubtasks = async (uid: string) => {
    try {
      const { data, error } = await supabase
        .from('subtasks')
        .select('*')
        .eq('user_id', uid)
        .order('created_at', { ascending: false });

      if (error) throw error;
      setSubtasks(data || []);
    } catch (err) {
      setError('Failed to load subtasks');
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

  const getTaskSubtasks = (taskId: string) => {
    return subtasks.filter((s) => s.task_id === taskId);
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
                  <li key={task.id}>
                    <TaskCard
                      task={task}
                      subtasks={getTaskSubtasks(task.id)}
                      onStatusChange={handleStatusChange}
                      onPriorityChange={handlePriorityChange}
                      onDeleteTask={handleDeleteTask}
                      onSubtasksLoad={() => userId && loadSubtasks(userId)}
                      userId={userId || ''}
                    />
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
