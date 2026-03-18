import React from "react";

const Login = () => {
  return (
    <div className="bg-background-light dark:bg-background-dark font-display antialiased min-h-screen flex items-center justify-center p-4 relative">
      
      <div className="absolute top-0 w-full px-6 py-8 flex justify-center">
        <div className="flex items-center gap-2">
          <div className="flex h-10 w-10 items-center justify-center rounded-lg bg-primary text-white shadow-lg shadow-primary/20">
            <span className="material-symbols-outlined text-2xl">
              assignment_turned_in
            </span>
          </div>
          <h1 className="text-2xl font-bold tracking-tight text-slate-900 dark:text-slate-100">
            Assignly
          </h1>
        </div>
      </div>

      <main className="w-full max-w-[440px]">
        <div className="overflow-hidden rounded-xl bg-white dark:bg-slate-900 shadow border border-slate-200/60 dark:border-slate-800">
          
          <div className="relative h-48 bg-primary/5 flex items-center justify-center">
            <div className="text-center px-8">
              <h2 className="text-2xl font-bold text-slate-900 dark:text-slate-100">
                Welcome back
              </h2>
              <p className="mt-2 text-sm text-slate-600 dark:text-slate-400">
                Streamline your workflow with the enterprise platform for modern teams.
              </p>
            </div>
          </div>

          <div className="p-8">
            
            {/* Google Button */}
            <button className="w-full flex items-center justify-center gap-3 rounded-lg border px-4 py-3.5 text-sm font-semibold hover:bg-slate-50">
              <span>Continue with Google</span>
            </button>

            <div className="my-8 text-center text-xs text-gray-400">
              Enterprise Secure Sign-on
            </div>

            <div className="p-4 rounded-lg bg-primary/5 border">
              <p className="text-xs font-semibold">Secure Environment</p>
              <p className="text-[11px] text-gray-500">
                Your session will be encrypted and protected.
              </p>
            </div>
          </div>

          <div className="px-8 py-6 text-center text-xs text-gray-500 border-t">
            By continuing, you agree to Terms & Privacy Policy.
          </div>

        </div>
      </main>
    </div>
  );
};

export default Login;