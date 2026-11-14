import { Routes, Route, Navigate } from 'react-router-dom';
import Shell from './components/Shell';
import Dashboard from './pages/Dashboard';
import NewInvoice from './pages/NewInvoice';
import History from './pages/History';
import InvoiceView from './pages/InvoiceView';
import Settings from './pages/Settings';
import Login from './pages/Login';
import ProtectedRoute from './components/ProtectedRoute';

export default function App() {
  return (
    <Routes>
      <Route path="/login" element={<Login />} />
      <Route element={<ProtectedRoute><Shell /></ProtectedRoute>}>
        <Route path="/" element={<Dashboard />} />
        <Route path="/new" element={<NewInvoice />} />
        <Route path="/history" element={<History />} />
        <Route path="/invoice/:id" element={<InvoiceView />} />
        <Route path="/settings" element={<Settings />} />
      </Route>
      <Route path="*" element={<Navigate to="/" replace />} />
    </Routes>
  );
}
