import React, { useState } from 'react';
import RegisterForm from '../components/Auth/RegisterForm.jsx';
import LoginForm from '../components/Auth/LoginForm.jsx';

const AuthPage = () => {
  const [isLoginView, setIsLoginView] = useState(true); // State to toggle between login and register

  const toggleView = () => {
    setIsLoginView(!isLoginView);
  };

  return (
    <div>
      <h1>TaskMaster Pro</h1>
      {isLoginView ? <LoginForm /> : <RegisterForm />}
      <button onClick={toggleView}>
        Switch to {isLoginView ? 'Register' : 'Login'}
      </button>
    </div>
  );
};

export default AuthPage;