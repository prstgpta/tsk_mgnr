import { useState } from 'react';
import { useNavigate } from 'react-router-dom';
import { Trash2 } from 'lucide-react';

interface Task {
  id: number;
  title: string;
}

export default function Dashboard() {
  const navigate = useNavigate();
  const [tasks, setTasks] = useState<Task[]>([
    { id: 1, title: 'Finish homework' },
    { id: 2, title: 'Call John' },
    { id: 3, title: 'Buy groceries' },
  ]);
  const [newTask, setNewTask] = useState('');

  const handleAddTask = () => {
    if (newTask.trim()) {
      setTasks([...tasks, { id: Date.now(), title: newTask }]);
      setNewTask('');
    }
  };

  const handleDeleteTask = (id: number) => {
    setTasks(tasks.filter(task => task.id !== id));
  };

  const handleKeyPress = (e: React.KeyboardEvent) => {
    if (e.key === 'Enter') {
      handleAddTask();
    }
  };

  const handleLogout = () => {
    navigate('/');
  };

  return (
    <div className="min-h-screen bg-gradient-to-br from-blue-400 via-blue-300 to-white px-4 py-8">
      <div className="max-w-2xl mx-auto">
        <h1 className="text-5xl md:text-6xl font-bold text-white drop-shadow-lg text-center mb-12">
          Your Tasks
        </h1>

        <div className="bg-white rounded-lg shadow-2xl p-8 space-y-8">
          <div className="space-y-4">
            {tasks.length > 0 ? (
              <ul className="space-y-3">
                {tasks.map((task) => (
                  <li
                    key={task.id}
                    className="flex items-center justify-between p-4 bg-gray-50 rounded-lg border-l-4 border-blue-600 hover:bg-gray-100 transition-colors"
                  >
                    <span className="text-lg text-gray-800 font-medium">
                      • {task.title}
                    </span>
                    <button
                      onClick={() => handleDeleteTask(task.id)}
                      className="text-red-500 hover:text-red-700 hover:scale-110 transition-all duration-200"
                      aria-label="Delete task"
                    >
                      <Trash2 size={20} />
                    </button>
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
              <button
                onClick={handleAddTask}
                className="px-8 py-3 bg-blue-600 text-white rounded-lg text-lg font-semibold shadow-lg hover:shadow-xl hover:bg-blue-700 transition-all duration-200 md:w-auto"
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
