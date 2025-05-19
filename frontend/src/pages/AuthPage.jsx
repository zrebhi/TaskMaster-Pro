import React from 'react';
import RegisterForm from '../components/Auth/RegisterForm.jsx';

const AuthPage = () => {
  return (
    <div>
      <h1>Welcome to TaskMaster Pro</h1>
      <RegisterForm />
      {/* <LoginForm /> */}
      {/* Add link to switch to Login form */}
    </div>
  );
};

export default AuthPage;