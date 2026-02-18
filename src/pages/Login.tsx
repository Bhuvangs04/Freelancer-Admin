import { useState, FormEvent } from "react";
import { useNavigate } from "react-router-dom";
import { Eye, EyeOff, Shield, Lock, Mail, KeyRound, Loader2 } from "lucide-react";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card";
import { Alert, AlertDescription } from "@/components/ui/alert";
import { xorEncrypt } from "@/lib/security";
import { useAuth } from "@/lib/auth";
import api from "@/lib/api";

// ─────────────────────────────────────────────────────────
// Login Step Type
// ─────────────────────────────────────────────────────────

type LoginStep = "credentials" | "2fa" | "change-password";

const LoginPage = () => {
  const navigate = useNavigate();
  const { login } = useAuth();

  // Form state
  const [email, setEmail] = useState("");
  const [password, setPassword] = useState("");
  const [secretCode, setSecretCode] = useState("");
  const [totpCode, setTotpCode] = useState("");
  const [newPassword, setNewPassword] = useState("");
  const [confirmPassword, setConfirmPassword] = useState("");
  const [showNewPassword, setShowNewPassword] = useState(false);
  const [successMsg, setSuccessMsg] = useState<string | null>(null);

  // UI state
  const [step, setStep] = useState<LoginStep>("credentials");
  const [showPassword, setShowPassword] = useState(false);
  const [isLoading, setIsLoading] = useState(false);
  const [error, setError] = useState<string | null>(null);

  // ─────────────────────────────────────────────────────────
  // Handle Step 1: Credentials
  // ─────────────────────────────────────────────────────────

  const handleCredentialSubmit = async (e: FormEvent) => {
    e.preventDefault();
    setError(null);
    setIsLoading(true);

    try {
      const encryptedEmail = xorEncrypt(email);
      const encryptedPassword = xorEncrypt(password);

      const response = await api.post("/api/vi/Manager/login", {
        email: encryptedEmail,
        password: encryptedPassword,
        secretCode,
      });

      const data = response.data;

      // Check if password change is required (first-time login)
      if (data.requiresPasswordChange) {
        setStep("change-password");
        setError(null);
        setIsLoading(false);
        return;
      }

      // Successful login (no 2FA required)
      login({
        username: data.username,
        email: data.email,
        role: data.role,
        chat_id: data.chat_id,
      });
      navigate("/");
    } catch (err: any) {
      const data = err.response?.data;
      if (data?.requires2FA) {
        // Move to 2FA step
        setStep("2fa");
        setError(null);
      } else {
        setError(data?.message || "Login failed. Please check your credentials.");
      }
    } finally {
      setIsLoading(false);
    }
  };

  // ─────────────────────────────────────────────────────────
  // Handle Step 2: 2FA Verification
  // ─────────────────────────────────────────────────────────

  const handle2FASubmit = async (e: FormEvent) => {
    e.preventDefault();
    setError(null);
    setIsLoading(true);

    try {
      const encryptedEmail = xorEncrypt(email);
      const encryptedPassword = xorEncrypt(password);

      const response = await api.post("/api/vi/Manager/login", {
        email: encryptedEmail,
        password: encryptedPassword,
        secretCode,
        totp_code: totpCode.trim(),
      });

      const data = response.data;

      if (data.requiresPasswordChange) {
        setStep("change-password");
        setError(null);
        setIsLoading(false);
        return;
      }

      login({
        username: data.username,
        email: data.email,
        role: data.role,
        chat_id: data.chat_id,
      });
      navigate("/");
    } catch (err: any) {
      const data = err.response?.data;
      setError(data?.message || "Invalid 2FA code. Please try again.");
    } finally {
      setIsLoading(false);
    }
  };

  // ─────────────────────────────────────────────────────────
  // Handle Step 3: Change Password (first-time login)
  // ─────────────────────────────────────────────────────────

  const handleChangePassword = async (e: FormEvent) => {
    e.preventDefault();
    setError(null);

    // Client-side validation
    if (newPassword.length < 12) {
      setError("Password must be at least 12 characters");
      return;
    }
    if (!/[A-Z]/.test(newPassword) || !/[a-z]/.test(newPassword) || !/[0-9]/.test(newPassword) || !/[!@#$%^&*()_+\-=\[\]{};':"\\|,.<>\/?]/.test(newPassword)) {
      setError("Password must include uppercase, lowercase, number, and special character");
      return;
    }
    if (newPassword !== confirmPassword) {
      setError("Passwords do not match");
      return;
    }

    setIsLoading(true);
    try {
      await api.put("/admin/settings/password", {
        currentPassword: password, // the temp password they logged in with
        newPassword,
      });

      // Reset and go back to login with success message
      setStep("credentials");
      setPassword("");
      setNewPassword("");
      setConfirmPassword("");
      setSuccessMsg("Password changed! Please sign in with your new password.");
    } catch (err: any) {
      setError(err.response?.data?.message || "Failed to change password");
    } finally {
      setIsLoading(false);
    }
  };

  // ─────────────────────────────────────────────────────────
  // Render
  // ─────────────────────────────────────────────────────────

  return (
    <div className="min-h-screen flex items-center justify-center bg-gradient-to-br from-slate-950 via-violet-950 to-slate-950 relative overflow-hidden">
      {/* Background effects */}
      <div className="absolute inset-0 overflow-hidden pointer-events-none">
        <div className="absolute -top-40 -right-40 w-80 h-80 bg-violet-500/10 rounded-full blur-3xl animate-pulse" />
        <div className="absolute -bottom-40 -left-40 w-96 h-96 bg-indigo-500/10 rounded-full blur-3xl animate-pulse delay-1000" />
        <div className="absolute top-1/2 left-1/2 -translate-x-1/2 -translate-y-1/2 w-[600px] h-[600px] bg-violet-600/5 rounded-full blur-3xl" />
      </div>

      {/* Subtle grid */}
      <div
        className="absolute inset-0 opacity-[0.03]"
        style={{
          backgroundImage:
            "linear-gradient(rgba(255,255,255,0.1) 1px, transparent 1px), linear-gradient(90deg, rgba(255,255,255,0.1) 1px, transparent 1px)",
          backgroundSize: "60px 60px",
        }}
      />

      <div className="w-full max-w-md px-4 relative z-10">
        {/* Logo / Branding */}
        <div className="text-center mb-8">
          <div className="inline-flex items-center justify-center w-16 h-16 rounded-2xl bg-gradient-to-br from-violet-600 to-indigo-600 shadow-lg shadow-violet-500/25 mb-4">
            <Shield className="w-8 h-8 text-white" />
          </div>
          <h1 className="text-2xl font-bold text-white tracking-tight">
            FreelancerHub
          </h1>
          <p className="text-sm text-slate-400 mt-1">Admin Panel</p>
        </div>

        {/* Login Card */}
        <Card className="border-white/10 bg-white/[0.04] backdrop-blur-xl shadow-2xl shadow-black/20">
          <CardHeader className="space-y-1 pb-4">
            <CardTitle className="text-xl text-white font-semibold">
              {step === "credentials" && "Sign in"}
              {step === "2fa" && "Two-Factor Authentication"}
              {step === "change-password" && "Change Password"}
            </CardTitle>
            <CardDescription className="text-slate-400">
              {step === "credentials" && "Enter your credentials to access the admin panel"}
              {step === "2fa" && "Enter the verification code from your authenticator app or a backup code"}
              {step === "change-password" && "You must set a new password before continuing"}
            </CardDescription>
          </CardHeader>

          <CardContent>
            {successMsg && (
              <Alert className="mb-4 border-green-500/30 bg-green-500/10 text-green-300">
                <AlertDescription>{successMsg}</AlertDescription>
              </Alert>
            )}
            {error && (
              <Alert variant="destructive" className="mb-4 border-red-500/30 bg-red-500/10 text-red-300">
                <AlertDescription>{error}</AlertDescription>
              </Alert>
            )}

            {/* ──── Step 1: Credentials ──── */}
            {step === "credentials" && (
              <form onSubmit={handleCredentialSubmit} className="space-y-4">
                {/* Email */}
                <div className="space-y-2">
                  <Label htmlFor="email" className="text-slate-300 text-sm">
                    Email Address
                  </Label>
                  <div className="relative">
                    <Mail className="absolute left-3 top-1/2 -translate-y-1/2 h-4 w-4 text-slate-500" />
                    <Input
                      id="email"
                      type="email"
                      placeholder="admin@example.com"
                      value={email}
                      onChange={(e) => setEmail(e.target.value)}
                      required
                      className="pl-10 bg-white/5 border-white/10 text-white placeholder:text-slate-600 focus:border-violet-500 focus:ring-violet-500/20"
                    />
                  </div>
                </div>

                {/* Password */}
                <div className="space-y-2">
                  <Label htmlFor="password" className="text-slate-300 text-sm">
                    Password
                  </Label>
                  <div className="relative">
                    <Lock className="absolute left-3 top-1/2 -translate-y-1/2 h-4 w-4 text-slate-500" />
                    <Input
                      id="password"
                      type={showPassword ? "text" : "password"}
                      placeholder="••••••••••••"
                      value={password}
                      onChange={(e) => setPassword(e.target.value)}
                      required
                      className="pl-10 pr-10 bg-white/5 border-white/10 text-white placeholder:text-slate-600 focus:border-violet-500 focus:ring-violet-500/20"
                    />
                    <button
                      type="button"
                      onClick={() => setShowPassword(!showPassword)}
                      className="absolute right-3 top-1/2 -translate-y-1/2 text-slate-500 hover:text-slate-300 transition-colors"
                    >
                      {showPassword ? <EyeOff className="h-4 w-4" /> : <Eye className="h-4 w-4" />}
                    </button>
                  </div>
                </div>

                {/* Secret Code */}
                <div className="space-y-2">
                  <Label htmlFor="secretCode" className="text-slate-300 text-sm">
                    Secret Code
                  </Label>
                  <div className="relative">
                    <KeyRound className="absolute left-3 top-1/2 -translate-y-1/2 h-4 w-4 text-slate-500" />
                    <Input
                      id="secretCode"
                      type="password"
                      placeholder="Enter your secret code"
                      value={secretCode}
                      onChange={(e) => setSecretCode(e.target.value)}
                      required
                      className="pl-10 bg-white/5 border-white/10 text-white placeholder:text-slate-600 focus:border-violet-500 focus:ring-violet-500/20"
                    />
                  </div>
                </div>

                <Button
                  type="submit"
                  disabled={isLoading}
                  className="w-full bg-gradient-to-r from-violet-600 to-indigo-600 hover:from-violet-700 hover:to-indigo-700 text-white font-medium shadow-lg shadow-violet-500/20 transition-all duration-200 hover:shadow-violet-500/30 h-11"
                >
                  {isLoading ? (
                    <>
                      <Loader2 className="mr-2 h-4 w-4 animate-spin" />
                      Authenticating...
                    </>
                  ) : (
                    "Sign In"
                  )}
                </Button>
              </form>
            )}

            {/* ──── Step 2: 2FA ──── */}
            {step === "2fa" && (
              <form onSubmit={handle2FASubmit} className="space-y-4">
                <div className="flex items-center gap-3 p-3 rounded-lg bg-violet-500/10 border border-violet-500/20 mb-2">
                  <Shield className="h-5 w-5 text-violet-400 flex-shrink-0" />
                  <p className="text-sm text-violet-300">
                    Your account has 2FA enabled. Enter an authenticator code or a backup code.
                  </p>
                </div>

                {/* TOTP / Backup Code */}
                <div className="space-y-2">
                  <Label htmlFor="totpCode" className="text-slate-300 text-sm">
                    Verification Code
                  </Label>
                  <div className="relative">
                    <Shield className="absolute left-3 top-1/2 -translate-y-1/2 h-4 w-4 text-slate-500" />
                    <Input
                      id="totpCode"
                      type="text"
                      placeholder="6-digit code or backup code"
                      value={totpCode}
                      onChange={(e) => setTotpCode(e.target.value)}
                      required
                      autoFocus
                      className="pl-10 bg-white/5 border-white/10 text-white placeholder:text-slate-600 focus:border-violet-500 focus:ring-violet-500/20 text-center text-lg tracking-[0.3em] font-mono"
                    />
                  </div>
                </div>

                <div className="flex gap-3">
                  <Button
                    type="button"
                    variant="outline"
                    onClick={() => {
                      setStep("credentials");
                      setError(null);
                      setTotpCode("");
                    }}
                    className="flex-1 border-white/10 bg-white/5 text-slate-300 hover:bg-white/10 hover:text-white"
                  >
                    Back
                  </Button>
                  <Button
                    type="submit"
                    disabled={isLoading}
                    className="flex-1 bg-gradient-to-r from-violet-600 to-indigo-600 hover:from-violet-700 hover:to-indigo-700 text-white font-medium shadow-lg shadow-violet-500/20"
                  >
                    {isLoading ? (
                      <>
                        <Loader2 className="mr-2 h-4 w-4 animate-spin" />
                        Verifying...
                      </>
                    ) : (
                      "Verify"
                    )}
                  </Button>
                </div>
              </form>
            )}

            {/* ──── Step 3: Change Password ──── */}
            {step === "change-password" && (
              <form onSubmit={handleChangePassword} className="space-y-4">
                <div className="flex items-center gap-3 p-3 rounded-lg bg-amber-500/10 border border-amber-500/20 mb-2">
                  <Lock className="h-5 w-5 text-amber-400 flex-shrink-0" />
                  <p className="text-sm text-amber-300">
                    Your account requires a password change. Set a strong new password to continue.
                  </p>
                </div>

                <div className="space-y-2">
                  <Label htmlFor="newPassword" className="text-slate-300 text-sm">New Password</Label>
                  <div className="relative">
                    <Lock className="absolute left-3 top-1/2 -translate-y-1/2 h-4 w-4 text-slate-500" />
                    <Input
                      id="newPassword"
                      type={showNewPassword ? "text" : "password"}
                      placeholder="Min 12 chars, upper, lower, number, special"
                      value={newPassword}
                      onChange={(e) => setNewPassword(e.target.value)}
                      required
                      autoFocus
                      className="pl-10 pr-10 bg-white/5 border-white/10 text-white placeholder:text-slate-600 focus:border-violet-500 focus:ring-violet-500/20"
                    />
                    <button
                      type="button"
                      onClick={() => setShowNewPassword(!showNewPassword)}
                      className="absolute right-3 top-1/2 -translate-y-1/2 text-slate-500 hover:text-slate-300 transition-colors"
                    >
                      {showNewPassword ? <EyeOff className="h-4 w-4" /> : <Eye className="h-4 w-4" />}
                    </button>
                  </div>
                </div>

                <div className="space-y-2">
                  <Label htmlFor="confirmPassword" className="text-slate-300 text-sm">Confirm Password</Label>
                  <div className="relative">
                    <Lock className="absolute left-3 top-1/2 -translate-y-1/2 h-4 w-4 text-slate-500" />
                    <Input
                      id="confirmPassword"
                      type="password"
                      placeholder="Re-enter your new password"
                      value={confirmPassword}
                      onChange={(e) => setConfirmPassword(e.target.value)}
                      required
                      className="pl-10 bg-white/5 border-white/10 text-white placeholder:text-slate-600 focus:border-violet-500 focus:ring-violet-500/20"
                    />
                  </div>
                </div>

                {/* Password strength hints */}
                <div className="text-xs text-slate-500 space-y-1">
                  <p className={newPassword.length >= 12 ? "text-green-400" : ""}>• At least 12 characters</p>
                  <p className={/[A-Z]/.test(newPassword) && /[a-z]/.test(newPassword) ? "text-green-400" : ""}>• Upper and lowercase letters</p>
                  <p className={/[0-9]/.test(newPassword) ? "text-green-400" : ""}>• At least one number</p>
                  <p className={/[!@#$%^&*()_+\-=\[\]{};':"\\|,.<>\/?]/.test(newPassword) ? "text-green-400" : ""}>• At least one special character</p>
                  <p className={newPassword && confirmPassword && newPassword === confirmPassword ? "text-green-400" : ""}>{confirmPassword ? (newPassword === confirmPassword ? "• Passwords match ✓" : "• Passwords do not match ✗") : "• Confirm your password"}</p>
                </div>

                <Button
                  type="submit"
                  disabled={isLoading}
                  className="w-full bg-gradient-to-r from-violet-600 to-indigo-600 hover:from-violet-700 hover:to-indigo-700 text-white font-medium shadow-lg shadow-violet-500/20 h-11"
                >
                  {isLoading ? (
                    <>
                      <Loader2 className="mr-2 h-4 w-4 animate-spin" />
                      Changing Password...
                    </>
                  ) : (
                    "Set New Password"
                  )}
                </Button>
              </form>
            )}

            {/* Footer */}
            <div className="mt-6 pt-4 border-t border-white/5 text-center">
              <p className="text-xs text-slate-500">
                Lost access?{" "}
                <span className="text-violet-400">Contact your Super Admin</span>{" "}
                for password or MFA reset.
              </p>
            </div>
          </CardContent>
        </Card>

        {/* Bottom branding */}
        <p className="text-center text-xs text-slate-600 mt-6">
          &copy; 2026 FreelancerHub. Secure Admin Access.
        </p>
      </div>
    </div>
  );
};

export default LoginPage;
