import React from "react";
import "./Auth.css";

const Signup = ({ setPage }) => {
  return (
    <div className="auth-container">
        <div className="app-logo">
  <div className="logo-box">✓</div>
  <div className="logo-text">Assignly</div>
</div>
      <div className="auth-card">

        <div className="auth-header">
          <h2>Create Account</h2>
          <p>Sign up to get started</p>
        </div>

        <div className="auth-body">

          <button className="google-btn">
            <img src="https://cdn-icons-png.flaticon.com/512/281/281764.png" />
            Continue with Google
          </button>

          <div className="divider">OR</div>

          <input type="text" placeholder="Name" />
          <input type="email" placeholder="Email" />
          <input type="password" placeholder="Password" />

          <button className="btn">Sign Up</button>

          <div className="switch-text">
            Already have an account?{" "}
            <span onClick={() => setPage("login")}>Login</span>
          </div>

        </div>
      </div>
    </div>
  );
};

export default Signup;