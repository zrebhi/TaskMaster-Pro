import { useContext } from 'react';
import { Link, useNavigate } from 'react-router-dom';
import AuthContext from '../../context/AuthContext.jsx';
import logoImage from '../../assets/TaskMasterPro_ClipboardRocketLeftLogo.png';

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
    <nav className="h-16 flex items-center justify-between p-2 border-b">
      <Link to="/" className="flex items-center space-x-2">
        <img src={logoImage} alt="TaskMaster Pro Logo" className="h-12" />
        <div className="flex flex-col">
          <span className="text-xl font-bold text-gray-800 sm:block">
            TaskMaster
          </span>
          <span className="text-xl font-bold text-gray-800 -mt-2">Pro</span>
        </div>
      </Link>

      <ul className="flex items-center space-x-2">
        {auth && auth.isAuthenticated ? (
          <>
            <li>
              <span>Welcome, {auth.user?.username || 'User'} !</span>
            </li>
            <li>
              <button
                onClick={handleLogout}
                className="bg-primary text-primary-foreground px-3 py-1 rounded"
              >
                Logout
              </button>
            </li>
          </>
        ) : (
          <>
            <button
              className="bg-primary text-primary-foreground px-2 py-1 rounded"
              onClick={() => navigate('/auth/login')}
            >
              Login
            </button>
            <button
              className="bg-primary text-primary-foreground px-2 py-1 rounded"
              onClick={() => navigate('/auth/register')}
            >
              Register
            </button>
          </>
        )}
      </ul>
    </nav>
  );
};

export default Navbar;
