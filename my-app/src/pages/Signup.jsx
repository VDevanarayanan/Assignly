import { useState } from "react";
import { auth, provider } from "../config/firebase";
import { createUserWithEmailAndPassword, signInWithPopup } from "firebase/auth";
import { useNavigate, Link } from "react-router-dom";
import "../styles/Auth.css";

export default function Signup() {
  const navigate = useNavigate();

  const [name, setName] = useState("");
  const [email, setEmail] = useState("");
  const [password, setPassword] = useState("");

  const handleSignup = async () => {
    try {
      const result = await createUserWithEmailAndPassword(auth, email, password);
      const token = await result.user.getIdToken();

      const res = await fetch("http://localhost:5001/auth/login", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ token }),
      });

      const data = await res.json();
      console.log("Signup response:", data);

      if (data.success) {
        localStorage.setItem("token", token);
        navigate("/dashboard");
      } else {
        alert("Signup failed");
      }
    } catch (err) {
      console.error(err);
      alert("Error signing up: " + err.message);
    }
  };

  const handleGoogleSignup = async () => {
    try {
      const result = await signInWithPopup(auth, provider);
      const token = await result.user.getIdToken();

      const res = await fetch("http://localhost:5001/auth/login", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ token }),
      });

      const data = await res.json();
      console.log("Signup response:", data);

      if (data.success) {
        localStorage.setItem("token", token);
        navigate("/dashboard");
      } else {
        alert("Signup failed");
      }
    } catch (err) {
      console.error(err);
      alert("Error with Google signup: " + err.message);
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
          <h2>Create Account</h2>
          <p>Sign up to get started</p>
        </div>

        <div className="auth-body">
          <button className="google-btn" onClick={handleGoogleSignup}>
            <img src="https://www.gstatic.com/firebasejs/ui/2.0.0/images/auth/google.svg" />
            Continue with Google
          </button>

          <div className="divider">OR</div>

          <input placeholder="Name" onChange={(e) => setName(e.target.value)} />
          <input placeholder="Email" onChange={(e) => setEmail(e.target.value)} />
          <input type="password" placeholder="Password" onChange={(e) => setPassword(e.target.value)} />

          <button className="submit-btn" onClick={handleSignup}>
            Sign Up
          </button>

          <p className="switch">
            Already have an account? <Link to="/">Login</Link>
          </p>
        </div>
      </div>
    </div>
  );
}