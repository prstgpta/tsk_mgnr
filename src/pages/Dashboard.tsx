import { useNavigate } from 'react-router-dom';

export default function Dashboard() {
  const navigate = useNavigate();

  return (
    <div className="min-h-screen bg-gradient-to-br from-blue-400 via-blue-300 to-white flex items-center justify-center px-4">
      <div className="text-center space-y-8 max-w-2xl w-full">
        <h1 className="text-5xl md:text-6xl font-bold text-white drop-shadow-lg">
          Dashboard
        </h1>
        <p className="text-xl text-white drop-shadow-lg">
          Your tasks will appear here
        </p>
        <button
          onClick={() => navigate('/')}
          className="px-8 py-4 bg-white text-blue-600 rounded-lg text-xl font-semibold shadow-lg hover:shadow-xl hover:scale-105 transition-all duration-200"
        >
          Back to Home
        </button>
      </div>
    </div>
  );
}
