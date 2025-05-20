import React, { useState, useContext } from "react";
import axios from "axios";
import { useNavigate } from "react-router-dom"; // For redirection after login
import AuthContext from "../../context/AuthContext.jsx";

const LoginForm = () => {
  const [formData, setFormData] = useState({
    identifier: "", // Can be email or username
    password: "",
  });
  const [error, setError] = useState("");
  const navigate = useNavigate();
  const auth = useContext(AuthContext);

  const { identifier, password } = formData;

  const onChange = (e) =>
    setFormData({ ...formData, [e.target.name]: e.target.value });

  const onSubmit = async (e) => {
    e.preventDefault();
    setError("");

    try {
      // Determine if the identifier is likely an email or username
      const isEmail = identifier.includes("@");

      const loginPayload = isEmail
        ? { email: identifier, password }
        : { username: identifier, password };

      const response = await axios.post("/api/auth/login", loginPayload);

      const data = response.data; // Axios puts response data in .data

      // Axios throws for non-2xx, so no need for !response.ok check here

      // Login successful, store the token and user data
      localStorage.setItem("token", data.token); // Store token in localStorage (or sessionStorage/HttpOnly cookie)
      localStorage.setItem("user", JSON.stringify(data.user));

      // Update auth state for Context
      if (auth && auth.login) {
        auth.login(data.token, data.user);
      }

      // Redirect to dashboard
      navigate("/dashboard");
      alert("Login successful! Token: " + data.token);
    } catch (err) {
      // Axios errors have a response property with status and data
      setError(
        err.response?.data?.message ||
          err.message ||
          "Login failed. Please check your credentials."
      );
      console.error("Login error:", err);
    }
  };

  return (
    <form onSubmit={onSubmit}>
      <h2>Login</h2>
      {error && <p style={{ color: "red" }}>{error}</p>}
      <div>
        <label htmlFor="identifier">Email or Username:</label>
        <input
          type="text"
          name="identifier"
          id="identifier"
          value={identifier}
          onChange={onChange}
          required
        />
      </div>
      <div>
        <label htmlFor="login-password">Password:</label>
        <input
          type="password"
          name="password"
          id="login-password"
          value={password}
          onChange={onChange}
          required
        />
      </div>
      <button type="submit">Login</button>
    </form>
  );
};

export default LoginForm;
