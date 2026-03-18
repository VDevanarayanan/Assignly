import { useState } from "react";
import { auth, provider } from "../config/firebase";
import { signInWithPopup, signInWithEmailAndPassword } from "firebase/auth";
import { useNavigate, Link } from "react-router-dom";
import "../styles/Auth.css";

export default function Login() {
  const navigate = useNavigate();

  const [email, setEmail] = useState("");
  const [password, setPassword] = useState("");

  const handleGoogleLogin = async () => {
    try {
      const result = await signInWithPopup(auth, provider);
      const token = await result.user.getIdToken();

      const res = await fetch("http://localhost:5001/auth/login", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ token }),
      });

      const data = await res.json();
      console.log("Login response:", data);

      if (data.success) {
        localStorage.setItem("token", token);
        navigate("/dashboard");
      } else {
        alert("Login failed");
      }
    } catch (err) {
      console.error(err);
      alert("Error logging in: " + err.message);
    }
  };

  const handleEmailLogin = async () => {
    try {
      const result = await signInWithEmailAndPassword(auth, email, password);
      const token = await result.user.getIdToken();

      const res = await fetch("http://localhost:5001/auth/login", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ token }),
      });

      const data = await res.json();
      console.log("Login response:", data);

      if (data.success) {
        localStorage.setItem("token", token);
        navigate("/dashboard");
      } else {
        alert("Login failed");
      }
    } catch (err) {
      console.error(err);
      alert("Invalid email or password: " + err.message);
    }
  };

  return (
    <div className="auth-container">
      <div className="app-logo">
        <div className="logo-box">✓</div>
        <div className="logo-text">Assignly</div>
      </div>

      <div className="auth-card">
        <div className="auth-header">
          <h2>Welcome back</h2>
          <p>Login to continue</p>
        </div>

        <div className="auth-body">
          <button className="google-btn" onClick={handleGoogleLogin}>
            <img src="https://www.gstatic.com/firebasejs/ui/2.0.0/images/auth/google.svg" />
            Continue with Google
          </button>

          <div className="divider">OR</div>

          <input type="email" placeholder="Email" onChange={(e) => setEmail(e.target.value)} />
          <input type="password" placeholder="Password" onChange={(e) => setPassword(e.target.value)} />

          <button className="submit-btn" onClick={handleEmailLogin}>
            Login
          </button>

          <p className="switch">
            Don’t have an account? <Link to="/signup">Sign up</Link>
          </p>
        </div>
      </div>
    </div>
  );
}