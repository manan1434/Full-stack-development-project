import { NavLink, useNavigate } from 'react-router-dom';
import { useAuth } from '../context/AuthContext';

export default function Navbar() {
  const { user, logout } = useAuth();
  const navigate = useNavigate();

  if (!user) return null;

  const handleLogout = async () => {
    await logout();
    navigate('/login');
  };

  return (
    <nav className="navbar">
      <div className="navbar-inner">
        <NavLink to="/" className="brand">💰 Expense Advisor</NavLink>
        <div className="nav-links">
          <NavLink to="/" end>Dashboard</NavLink>
          <NavLink to="/expenses">Expenses</NavLink>
          <NavLink to="/budgets">Budgets</NavLink>
        </div>
        <div className="nav-user">
          <span className="muted">{user.name}</span>
          <button className="btn btn-ghost" onClick={handleLogout}>Logout</button>
        </div>
      </div>
    </nav>
  );
}
