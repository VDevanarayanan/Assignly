import { useState } from "react";
import { auth, provider } from "../config/firebase";
import { signInWithPopup, signInWithEmailAndPassword } from "firebase/auth";
import { useNavigate, Link } from "react-router-dom";

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
    <div className="flex items-center justify-center min-h-screen bg-background-light dark:bg-background-dark p-4 font-sans relative overflow-hidden">
      {/* Decorative background blobs */}
      <div className="absolute top-0 left-0 w-full h-full overflow-hidden z-0 pointer-events-none">
        <div className="absolute top-[-10%] left-[-10%] w-[40%] h-[40%] bg-primary/20 blur-[100px] rounded-full"></div>
        <div className="absolute bottom-[-10%] right-[-10%] w-[40%] h-[40%] bg-blue-500/10 blur-[100px] rounded-full"></div>
      </div>

      <div className="w-full max-w-md bg-white dark:bg-slate-900 rounded-[2rem] shadow-2xl shadow-slate-200/50 dark:shadow-black/50 border border-slate-100 dark:border-slate-800 overflow-hidden relative z-10 transition-all duration-300 hover:shadow-primary/10">
        
        {/* Header Section */}
        <div className="pt-10 sm:pt-12 pb-6 sm:pb-8 px-6 sm:px-10 text-center relative">
          <div className="absolute top-0 left-0 w-full h-1 bg-gradient-to-r from-primary via-blue-500 to-primary"></div>
          
          <div className="flex flex-col sm:flex-row items-center justify-center gap-3 sm:gap-4 mb-4">
            <div className="flex items-center justify-center size-12 sm:size-16 rounded-2xl bg-primary text-white shadow-xl shadow-primary/30 rotate-3 hover:rotate-0 transition-transform duration-300">
              <span className="material-symbols-outlined text-3xl sm:text-4xl leading-none">task_alt</span>
            </div>
            <h1 className="text-3xl sm:text-4xl font-black text-slate-900 dark:text-white tracking-tight">
              Assign<span className="text-transparent bg-clip-text bg-gradient-to-r from-primary to-blue-500">ly</span>
            </h1>
          </div>
          
          <h2 className="text-xl sm:text-2xl font-bold text-slate-800 dark:text-slate-200 tracking-tight mb-1 mt-6">Welcome Back</h2>
          <p className="text-slate-500 dark:text-slate-400 font-medium">Sign in to continue</p>
        </div>

        {/* Body Section */}
        <div className="px-6 sm:px-10 pb-10 sm:pb-12">
          <button 
            onClick={handleGoogleLogin}
            className="w-full flex items-center justify-center gap-3 bg-white dark:bg-slate-800 border-2 border-slate-100 dark:border-slate-700 hover:border-slate-200 dark:hover:border-slate-600 hover:bg-slate-50 dark:hover:bg-slate-700 text-slate-700 dark:text-white font-bold py-3.5 px-4 rounded-xl transition-all duration-300 hover:scale-[1.02] hover:-translate-y-1 hover:shadow-xl mb-6 group cursor-pointer"
          >
            <img src="https://www.gstatic.com/firebasejs/ui/2.0.0/images/auth/google.svg" alt="Google" className="size-5 group-hover:scale-110 transition-transform" />
            Continue with Google
          </button>

          <div className="flex items-center gap-4 mb-6">
            <div className="flex-1 h-px bg-slate-100 dark:bg-slate-800"></div>
            <span className="text-[11px] font-bold text-slate-400 tracking-widest uppercase">OR</span>
            <div className="flex-1 h-px bg-slate-100 dark:bg-slate-800"></div>
          </div>

          <div className="flex flex-col gap-4 mb-8">
            <div>
              <label className="block text-sm font-bold text-slate-700 dark:text-slate-300 mb-2">Email Address</label>
              <div className="relative">
                <span className="material-symbols-outlined absolute left-4 top-1/2 -translate-y-1/2 text-slate-400 text-xl pointer-events-none">mail</span>
                <input 
                  type="email" 
                  placeholder="you@example.com" 
                  onChange={(e) => setEmail(e.target.value)} 
                  className="w-full bg-slate-50 dark:bg-slate-800/50 border border-slate-200 dark:border-slate-700 rounded-xl pl-12 pr-4 py-3.5 text-slate-900 dark:text-white placeholder:text-slate-400 focus:ring-2 focus:ring-primary/50 focus:border-primary focus:bg-white dark:focus:bg-slate-800 transition-all font-medium text-sm outline-none"
                />
              </div>
            </div>
            <div>
              <div className="flex items-center justify-between mb-2">
                <label className="block text-sm font-bold text-slate-700 dark:text-slate-300">Password</label>
              </div>
              <div className="relative">
                <span className="material-symbols-outlined absolute left-4 top-1/2 -translate-y-1/2 text-slate-400 text-xl pointer-events-none">lock</span>
                <input 
                  type="password" 
                  placeholder="••••••••" 
                  onChange={(e) => setPassword(e.target.value)} 
                  className="w-full bg-slate-50 dark:bg-slate-800/50 border border-slate-200 dark:border-slate-700 rounded-xl pl-12 pr-4 py-3.5 text-slate-900 dark:text-white placeholder:text-slate-400 focus:ring-2 focus:ring-primary/50 focus:border-primary focus:bg-white dark:focus:bg-slate-800 transition-all font-medium text-sm outline-none"
                />
              </div>
            </div>
          </div>

          <button 
            onClick={handleEmailLogin}
            className="w-full bg-primary text-white font-bold text-base py-4 px-4 rounded-xl shadow-[0_8px_20px_-6px_rgba(80,72,229,0.5)] hover:shadow-[0_12px_24px_-6px_rgba(80,72,229,0.6)] hover:-translate-y-0.5 transition-all active:scale-[0.98] active:translate-y-0 mb-8 flex items-center justify-center gap-2"
          >
            Sign In to Assignly
            <span className="material-symbols-outlined text-sm font-bold">arrow_forward</span>
          </button>

          <div className="bg-slate-50 dark:bg-slate-800/50 rounded-xl p-4 text-center border border-slate-100 dark:border-slate-800">
            <p className="text-slate-600 dark:text-slate-400 font-medium text-sm">
              Don't have an account?{" "}
              <Link to="/signup" className="text-primary hover:text-primary/80 transition-colors font-bold ml-1 inline-flex items-center gap-1">
                Create one now
                <span className="material-symbols-outlined text-[14px]">chevron_right</span>
              </Link>
            </p>
          </div>
        </div>
      </div>
    </div>
  );
}