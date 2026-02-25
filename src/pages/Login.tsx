import { useState } from "react";
import { useNavigate } from "react-router-dom";
import { User, X, Eye, EyeOff } from "lucide-react";
import campusBg from "@/assets/campus-bg.jpg";
import { setRole, type AppRole } from "@/hooks/useRole";

type AuthMode = "login" | "signup";

interface AlertBanner {
  message: string;
  type: "warning" | "success";
}

const Login = () => {
  const navigate = useNavigate();
  const [mode, setMode] = useState<AuthMode>("login");
  const [alert, setAlert] = useState<AlertBanner | null>({
    message: "Your session has timed out. Please log in again.",
    type: "warning",
  });
  const [showPassword, setShowPassword] = useState(false);
  const [showConfirm, setShowConfirm] = useState(false);
  const [selectedRole, setSelectedRole] = useState<AppRole>("student");

  // Form state
  const [email, setEmail] = useState("");
  const [password, setPassword] = useState("");
  const [fullName, setFullName] = useState("");
  const [confirmPassword, setConfirmPassword] = useState("");

  const handleSubmit = (e: React.FormEvent) => {
    e.preventDefault();
    if (mode === "signup") {
      setAlert({ message: "Account created successfully!", type: "success" });
      setMode("login");
    } else {
      setRole(selectedRole);
      navigate("/");
    }
  };

  return (
    <div className="min-h-screen flex">
      {/* Left: Auth Card */}
      <div className="w-full lg:w-[45%] flex items-center justify-center bg-background p-6 sm:p-12">
        <div className="w-full max-w-md space-y-6">
          {/* Logo */}
          <div className="mb-2">
            <h1 className="text-4xl font-bold tracking-tight">
              <span className="text-primary">W</span>
              <span className="text-accent">i</span>
              <span className="text-foreground">SE</span>
              <span className="text-primary font-extrabold">NET</span>
            </h1>
          </div>

          {/* Alert Banner */}
          {alert && (
            <div
              className={`flex items-center justify-between rounded-full px-5 py-2.5 text-sm ${
                alert.type === "warning"
                  ? "bg-orange-50 text-orange-700 border border-orange-200"
                  : "bg-green-50 text-green-700 border border-green-200"
              }`}
            >
              <span>{alert.message}</span>
              <button onClick={() => setAlert(null)} className="ml-3 hover:opacity-70">
                <X size={16} />
              </button>
            </div>
          )}

          {/* Toggle Tabs */}
          <div className="flex border-b border-border">
            <button
              onClick={() => setMode("login")}
              className={`pb-2.5 px-4 text-sm font-medium transition-colors ${
                mode === "login"
                  ? "text-primary border-b-2 border-primary"
                  : "text-muted-foreground hover:text-foreground"
              }`}
            >
              Log In
            </button>
            <button
              onClick={() => setMode("signup")}
              className={`pb-2.5 px-4 text-sm font-medium transition-colors ${
                mode === "signup"
                  ? "text-primary border-b-2 border-primary"
                  : "text-muted-foreground hover:text-foreground"
              }`}
            >
              Sign Up
            </button>
          </div>

          {/* Role Switcher */}
          {mode === "login" && (
            <div className="flex items-center gap-2">
              <span className="text-sm text-muted-foreground">Login as:</span>
              <div className="flex rounded-lg border bg-secondary/50 p-0.5">
                <button
                  type="button"
                  onClick={() => setSelectedRole("student")}
                  className={`rounded-md px-4 py-1.5 text-sm font-medium transition-colors ${
                    selectedRole === "student"
                      ? "bg-primary text-primary-foreground"
                      : "text-muted-foreground hover:text-foreground"
                  }`}
                >
                  Student
                </button>
                <button
                  type="button"
                  onClick={() => setSelectedRole("ta")}
                  className={`rounded-md px-4 py-1.5 text-sm font-medium transition-colors ${
                    selectedRole === "ta"
                      ? "bg-primary text-primary-foreground"
                      : "text-muted-foreground hover:text-foreground"
                  }`}
                >
                  Teaching Assistant
                </button>
              </div>
            </div>
          )}

          {/* Form */}
          <form onSubmit={handleSubmit} className="space-y-4">
            {mode === "signup" && (
              <input
                type="text"
                placeholder="Full Name"
                value={fullName}
                onChange={(e) => setFullName(e.target.value)}
                required
                className="w-full rounded-lg border border-border bg-background px-4 py-3 text-sm text-foreground placeholder:text-muted-foreground focus:outline-none focus:ring-2 focus:ring-primary/30 focus:border-primary"
              />
            )}

            <input
              type="email"
              placeholder={mode === "login" ? "name@spjimr.org" : "Institutional Email"}
              value={email}
              onChange={(e) => setEmail(e.target.value)}
              required
              className="w-full rounded-lg border border-border bg-background px-4 py-3 text-sm text-foreground placeholder:text-muted-foreground focus:outline-none focus:ring-2 focus:ring-primary/30 focus:border-primary"
            />

            <div className="relative">
              <input
                type={showPassword ? "text" : "password"}
                placeholder="Password"
                value={password}
                onChange={(e) => setPassword(e.target.value)}
                required
                className="w-full rounded-lg border border-border bg-background px-4 py-3 pr-10 text-sm text-foreground placeholder:text-muted-foreground focus:outline-none focus:ring-2 focus:ring-primary/30 focus:border-primary"
              />
              <button
                type="button"
                onClick={() => setShowPassword(!showPassword)}
                className="absolute right-3 top-1/2 -translate-y-1/2 text-muted-foreground hover:text-foreground"
              >
                {showPassword ? <EyeOff size={18} /> : <Eye size={18} />}
              </button>
            </div>

            {mode === "signup" && (
              <div className="relative">
                <input
                  type={showConfirm ? "text" : "password"}
                  placeholder="Confirm Password"
                  value={confirmPassword}
                  onChange={(e) => setConfirmPassword(e.target.value)}
                  required
                  className="w-full rounded-lg border border-border bg-background px-4 py-3 pr-10 text-sm text-foreground placeholder:text-muted-foreground focus:outline-none focus:ring-2 focus:ring-primary/30 focus:border-primary"
                />
                <button
                  type="button"
                  onClick={() => setShowConfirm(!showConfirm)}
                  className="absolute right-3 top-1/2 -translate-y-1/2 text-muted-foreground hover:text-foreground"
                >
                  {showConfirm ? <EyeOff size={18} /> : <Eye size={18} />}
                </button>
              </div>
            )}

            <button
              type="submit"
              className="rounded-lg bg-primary px-6 py-3 text-sm font-semibold text-primary-foreground hover:bg-primary/90 transition-colors"
            >
              {mode === "login" ? "Log in" : "Sign Up"}
            </button>

            {mode === "login" && (
              <div>
                <button type="button" className="text-sm text-primary hover:underline">
                  Lost password?
                </button>
              </div>
            )}
          </form>

          {/* SSO Section */}
          <div className="border-t border-border pt-5 space-y-3">
            <p className="text-sm font-semibold text-foreground">Log in using your account on:</p>
            <button className="flex items-center gap-3 rounded-lg border border-border px-5 py-3 text-sm text-foreground hover:bg-secondary transition-colors">
              <User size={20} className="text-muted-foreground" />
              Login via SPJIMR email id
            </button>
          </div>
        </div>
      </div>

      {/* Right: Campus Image */}
      <div className="hidden lg:block lg:w-[55%] relative">
        <img
          src={campusBg}
          alt="SPJIMR Campus"
          className="absolute inset-0 w-full h-full object-cover"
        />
      </div>
    </div>
  );
};

export default Login;
