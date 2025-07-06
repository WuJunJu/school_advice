import { BrowserRouter as Router, Routes, Route, Navigate } from 'react-router-dom';
import AdminLoginPage from './pages/AdminLoginPage';
import AdminDashboardPage from './pages/AdminDashboardPage';
import ProtectedRoute from './components/ProtectedRoute';
import PublicSuggestionsPage from './pages/PublicSuggestionsPage';
import SubmitSuggestionPage from './pages/SubmitSuggestionPage';
import QuerySuggestionPage from './pages/QuerySuggestionPage';
import AppLayout from './components/AppLayout';
import './App.css';

function App() {
  return (
    <Router>
      <Routes>
        <Route element={<AppLayout />}>
          <Route path="/" element={<Navigate to="/public-suggestions" replace />} />
          <Route path="/public-suggestions" element={<PublicSuggestionsPage />} />
          <Route path="/submit-suggestion" element={<SubmitSuggestionPage />} />
          <Route path="/query-suggestion" element={<QuerySuggestionPage />} />
        </Route>
        
        <Route path="/admin/login" element={<AdminLoginPage />} />
        <Route element={<ProtectedRoute />}>
          <Route path="/admin/dashboard/*" element={<AdminDashboardPage />} />
        </Route>
      </Routes>
    </Router>
  );
}

export default App;
