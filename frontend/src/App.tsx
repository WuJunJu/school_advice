import { BrowserRouter as Router, Routes, Route } from 'react-router-dom';
import HomePage from './pages/HomePage';
import BoardPage from './pages/BoardPage';
import AdminLoginPage from './pages/AdminLoginPage';
import AdminDashboardPage from './pages/AdminDashboardPage';
import ProtectedRoute from './components/ProtectedRoute';
import PublicSuggestionsPage from './pages/PublicSuggestionsPage'; // Import the new page
import './App.css';

function App() {
  return (
    <Router>
      <Routes>
        <Route path="/" element={<HomePage />} />
        <Route path="/board" element={<BoardPage />} />
        <Route path="/public-suggestions" element={<PublicSuggestionsPage />} /> // Add route for public suggestions
        <Route path="/admin/login" element={<AdminLoginPage />} />
        <Route element={<ProtectedRoute />}>
          <Route path="/admin/dashboard/*" element={<AdminDashboardPage />} />
        </Route>
      </Routes>
    </Router>
  );
}

export default App;
