import { useContext } from 'react';
import { Link, useNavigate } from 'react-router-dom';
import AuthContext from '../../context/AuthContext.jsx';

const Navbar = () => {
  const auth = useContext(AuthContext);
  const navigate = useNavigate();

  const handleLogout = async () => {
    if (auth && auth.logout) {
      auth.logout(); // Clears client-side token & user state
    }
    navigate('/auth'); // Redirect to login/auth page
  };

  return (
    <nav>
      <Link to="/">TaskMaster Pro</Link>
      <ul>
        {auth && auth.isAuthenticated ? (
          <>
            <li><span>Welcome, {auth.user?.username || 'User'}</span></li>
            <li><button onClick={handleLogout}>Logout</button></li>
            <li><Link to="/dashboard">Dashboard</Link></li> {/* Example link */}
          </>
        ) : (
          <>
            <li><Link to="/auth">Login | Register</Link></li>
          </>
        )}
      </ul>
    </nav>
  );
};

export default Navbar;
