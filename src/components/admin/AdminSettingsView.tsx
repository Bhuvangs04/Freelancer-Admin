import { useState, useEffect } from "react";
import {
  User, Lock, Shield, KeyRound, RefreshCw, Eye, EyeOff,
  Loader2, CheckCircle, AlertTriangle, Copy, Check
} from "lucide-react";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card";
import { Alert, AlertDescription } from "@/components/ui/alert";
import { Badge } from "@/components/ui/badge";
import { Separator } from "@/components/ui/separator";
import { Tabs, TabsContent, TabsList, TabsTrigger } from "@/components/ui/tabs";
import { Switch } from "@/components/ui/switch";
import api from "@/lib/api";
import { useAuth } from "@/lib/auth";

// ─────────────────────────────────────────────────────────
// Admin Settings View
// ─────────────────────────────────────────────────────────

export const AdminSettingsView = () => {
  const { admin, login } = useAuth();

  // Profile state
  const [username, setUsername] = useState(admin?.username || "");
  const [profileLoading, setProfileLoading] = useState(false);
  const [profileMsg, setProfileMsg] = useState<{ type: "success" | "error"; text: string } | null>(null);

  // Password state
  const [currentPassword, setCurrentPassword] = useState("");
  const [newPassword, setNewPassword] = useState("");
  const [confirmPassword, setConfirmPassword] = useState("");
  const [showPasswords, setShowPasswords] = useState(false);
  const [passwordLoading, setPasswordLoading] = useState(false);
  const [passwordMsg, setPasswordMsg] = useState<{ type: "success" | "error"; text: string } | null>(null);

  // 2FA state
  const [twoFAEnabled, setTwoFAEnabled] = useState(false);
  const [setupStep, setSetupStep] = useState<"idle" | "qr" | "verify">("idle");
  const [qrCode, setQrCode] = useState("");
  const [secretKey, setSecretKey] = useState("");
  const [verifyCode, setVerifyCode] = useState("");
  const [customSecret, setCustomSecret] = useState("");
  const [useCustomSecret, setUseCustomSecret] = useState(false);
  const [twoFALoading, setTwoFALoading] = useState(false);
  const [twoFAMsg, setTwoFAMsg] = useState<{ type: "success" | "error"; text: string } | null>(null);

  // Backup codes state
  const [backupCodes, setBackupCodes] = useState<string[]>([]);
  const [backupRemaining, setBackupRemaining] = useState(0);
  const [showBackupCodes, setShowBackupCodes] = useState(false);
  const [copiedCode, setCopiedCode] = useState<string | null>(null);

  // Disable 2FA state
  const [disablePassword, setDisablePassword] = useState("");
  const [disableCode, setDisableCode] = useState("");
  const [disableLoading, setDisableLoading] = useState(false);

  // ─── Load profile data ────────────────────────────────
  useEffect(() => {
    const loadProfile = async () => {
      try {
        const res = await api.get("/admin/settings/profile");
        const data = res.data.admin;
        setUsername(data.username);
        setTwoFAEnabled(data.twoFactorEnabled);
        setBackupRemaining(data.backupCodesRemaining || 0);
      } catch {
        // Silently handled
      }
    };
    loadProfile();
  }, []);

  // ─── Profile Update ──────────────────────────────────
  const handleProfileUpdate = async () => {
    setProfileLoading(true);
    setProfileMsg(null);
    try {
      const res = await api.put("/admin/settings/profile", { username });
      if (admin) {
        login({ ...admin, username: res.data.username });
      }
      setProfileMsg({ type: "success", text: "Profile updated successfully" });
    } catch (err: any) {
      setProfileMsg({ type: "error", text: err.response?.data?.message || "Failed to update profile" });
    } finally {
      setProfileLoading(false);
    }
  };

  // ─── Password Change ─────────────────────────────────
  const handlePasswordChange = async () => {
    if (newPassword !== confirmPassword) {
      setPasswordMsg({ type: "error", text: "Passwords do not match" });
      return;
    }
    setPasswordLoading(true);
    setPasswordMsg(null);
    try {
      await api.put("/admin/settings/password", { currentPassword, newPassword });
      setPasswordMsg({ type: "success", text: "Password changed successfully" });
      setCurrentPassword("");
      setNewPassword("");
      setConfirmPassword("");
    } catch (err: any) {
      setPasswordMsg({ type: "error", text: err.response?.data?.message || "Failed to change password" });
    } finally {
      setPasswordLoading(false);
    }
  };

  // ─── 2FA Setup ────────────────────────────────────────
  const handleSetup2FA = async () => {
    setTwoFALoading(true);
    setTwoFAMsg(null);
    try {
      const payload: any = {};
      if (useCustomSecret && customSecret) {
        payload.customSecret = customSecret;
      }
      const res = await api.post("/admin/settings/2fa/setup", payload);
      setQrCode(res.data.qrCode);
      setSecretKey(res.data.secret);
      setSetupStep("qr");
    } catch (err: any) {
      setTwoFAMsg({ type: "error", text: err.response?.data?.message || "Failed to start 2FA setup" });
    } finally {
      setTwoFALoading(false);
    }
  };

  const handleVerify2FA = async () => {
    setTwoFALoading(true);
    setTwoFAMsg(null);
    try {
      const res = await api.post("/admin/settings/2fa/verify", { totp_code: verifyCode });
      setTwoFAEnabled(true);
      setBackupCodes(res.data.backupCodes);
      setBackupRemaining(res.data.backupCodes.length);
      setSetupStep("idle");
      setShowBackupCodes(true);
      setTwoFAMsg({ type: "success", text: "2FA enabled successfully! Save your backup codes." });
    } catch (err: any) {
      setTwoFAMsg({ type: "error", text: err.response?.data?.message || "Invalid verification code" });
    } finally {
      setTwoFALoading(false);
    }
  };

  const handleDisable2FA = async () => {
    setDisableLoading(true);
    setTwoFAMsg(null);
    try {
      await api.post("/admin/settings/2fa/disable", {
        password: disablePassword,
        totp_code: disableCode,
      });
      setTwoFAEnabled(false);
      setSecretKey("");
      setQrCode("");
      setBackupCodes([]);
      setDisablePassword("");
      setDisableCode("");
      setTwoFAMsg({ type: "success", text: "2FA disabled successfully" });
    } catch (err: any) {
      setTwoFAMsg({ type: "error", text: err.response?.data?.message || "Failed to disable 2FA" });
    } finally {
      setDisableLoading(false);
    }
  };

  // ─── Backup Codes ─────────────────────────────────────
  const loadBackupCodes = async () => {
    try {
      const res = await api.get("/admin/settings/2fa/backup-codes");
      setBackupCodes(res.data.codes);
      setBackupRemaining(res.data.remaining);
      setShowBackupCodes(true);
    } catch {
      setTwoFAMsg({ type: "error", text: "Failed to load backup codes" });
    }
  };

  const regenerateBackupCodes = async () => {
    const code = prompt("Enter your current TOTP code to regenerate backup codes:");
    if (!code) return;
    try {
      const res = await api.post("/admin/settings/2fa/regenerate-backup", { totp_code: code });
      setBackupCodes(res.data.backupCodes);
      setBackupRemaining(res.data.backupCodes.length);
      setShowBackupCodes(true);
      setTwoFAMsg({ type: "success", text: "Backup codes regenerated" });
    } catch (err: any) {
      setTwoFAMsg({ type: "error", text: err.response?.data?.message || "Failed to regenerate" });
    }
  };

  const copyToClipboard = (text: string) => {
    navigator.clipboard.writeText(text);
    setCopiedCode(text);
    setTimeout(() => setCopiedCode(null), 2000);
  };

  // ─────────────────────────────────────────────────────────
  // Render
  // ─────────────────────────────────────────────────────────

  return (
    <div className="space-y-6 max-w-3xl">
      <div>
        <h2 className="text-2xl font-bold text-gray-900">Account Settings</h2>
        <p className="text-sm text-muted-foreground mt-1">Manage your admin profile, password, and security settings</p>
      </div>

      <Tabs defaultValue="profile" className="space-y-4">
        <TabsList className="bg-violet-50 border border-violet-100">
          <TabsTrigger value="profile" className="data-[state=active]:bg-violet-600 data-[state=active]:text-white">
            <User className="h-4 w-4 mr-1.5" /> Profile
          </TabsTrigger>
          <TabsTrigger value="password" className="data-[state=active]:bg-violet-600 data-[state=active]:text-white">
            <Lock className="h-4 w-4 mr-1.5" /> Password
          </TabsTrigger>
          <TabsTrigger value="2fa" className="data-[state=active]:bg-violet-600 data-[state=active]:text-white">
            <Shield className="h-4 w-4 mr-1.5" /> Two-Factor Auth
          </TabsTrigger>
        </TabsList>

        {/* ──── Profile Tab ──── */}
        <TabsContent value="profile">
          <Card>
            <CardHeader>
              <CardTitle className="text-lg">Profile Information</CardTitle>
              <CardDescription>Update your display name</CardDescription>
            </CardHeader>
            <CardContent className="space-y-4">
              {profileMsg && (
                <Alert variant={profileMsg.type === "error" ? "destructive" : "default"} className={profileMsg.type === "success" ? "border-green-200 bg-green-50 text-green-800" : ""}>
                  <AlertDescription>{profileMsg.text}</AlertDescription>
                </Alert>
              )}
              <div className="space-y-2">
                <Label>Username</Label>
                <Input value={username} onChange={(e) => setUsername(e.target.value)} placeholder="Your display name" />
              </div>
              <div className="space-y-2">
                <Label>Email</Label>
                <Input value={admin?.email || ""} disabled className="bg-gray-50" />
                <p className="text-xs text-muted-foreground">Email cannot be changed</p>
              </div>
              <div className="space-y-2">
                <Label>Role</Label>
                <Badge variant="outline" className="text-violet-700 border-violet-200 capitalize">
                  {admin?.role === "super_admin" ? "Super Admin" : "Admin"}
                </Badge>
              </div>
              <Button onClick={handleProfileUpdate} disabled={profileLoading} className="bg-violet-600 hover:bg-violet-700">
                {profileLoading ? <Loader2 className="mr-2 h-4 w-4 animate-spin" /> : null}
                Save Changes
              </Button>
            </CardContent>
          </Card>
        </TabsContent>

        {/* ──── Password Tab ──── */}
        <TabsContent value="password">
          <Card>
            <CardHeader>
              <CardTitle className="text-lg">Change Password</CardTitle>
              <CardDescription>Must be 12+ characters with uppercase, lowercase, number, and special character</CardDescription>
            </CardHeader>
            <CardContent className="space-y-4">
              {passwordMsg && (
                <Alert variant={passwordMsg.type === "error" ? "destructive" : "default"} className={passwordMsg.type === "success" ? "border-green-200 bg-green-50 text-green-800" : ""}>
                  <AlertDescription>{passwordMsg.text}</AlertDescription>
                </Alert>
              )}
              <div className="space-y-2">
                <Label>Current Password</Label>
                <div className="relative">
                  <Input
                    type={showPasswords ? "text" : "password"}
                    value={currentPassword}
                    onChange={(e) => setCurrentPassword(e.target.value)}
                    placeholder="Enter current password"
                  />
                  <button type="button" onClick={() => setShowPasswords(!showPasswords)} className="absolute right-3 top-2.5 text-gray-400 hover:text-gray-600">
                    {showPasswords ? <EyeOff className="h-4 w-4" /> : <Eye className="h-4 w-4" />}
                  </button>
                </div>
              </div>
              <div className="space-y-2">
                <Label>New Password</Label>
                <Input type={showPasswords ? "text" : "password"} value={newPassword} onChange={(e) => setNewPassword(e.target.value)} placeholder="Enter new password" />
              </div>
              <div className="space-y-2">
                <Label>Confirm New Password</Label>
                <Input type={showPasswords ? "text" : "password"} value={confirmPassword} onChange={(e) => setConfirmPassword(e.target.value)} placeholder="Confirm new password" />
              </div>
              <Button onClick={handlePasswordChange} disabled={passwordLoading || !currentPassword || !newPassword} className="bg-violet-600 hover:bg-violet-700">
                {passwordLoading ? <Loader2 className="mr-2 h-4 w-4 animate-spin" /> : null}
                Change Password
              </Button>
            </CardContent>
          </Card>
        </TabsContent>

        {/* ──── 2FA Tab ──── */}
        <TabsContent value="2fa">
          <Card>
            <CardHeader>
              <div className="flex items-center justify-between">
                <div>
                  <CardTitle className="text-lg">Two-Factor Authentication</CardTitle>
                  <CardDescription>Protect your account with TOTP-based 2FA</CardDescription>
                </div>
                <Badge variant={twoFAEnabled ? "default" : "secondary"} className={twoFAEnabled ? "bg-green-100 text-green-800 border-green-200" : "bg-red-50 text-red-600 border-red-200"}>
                  {twoFAEnabled ? (
                    <><CheckCircle className="h-3 w-3 mr-1" /> Enabled</>
                  ) : (
                    <><AlertTriangle className="h-3 w-3 mr-1" /> Disabled</>
                  )}
                </Badge>
              </div>
            </CardHeader>
            <CardContent className="space-y-4">
              {twoFAMsg && (
                <Alert variant={twoFAMsg.type === "error" ? "destructive" : "default"} className={twoFAMsg.type === "success" ? "border-green-200 bg-green-50 text-green-800" : ""}>
                  <AlertDescription>{twoFAMsg.text}</AlertDescription>
                </Alert>
              )}

              {/* ─── Setup Flow ─── */}
              {!twoFAEnabled && setupStep === "idle" && (
                <div className="space-y-4">
                  <div className="flex items-center gap-3">
                    <Switch checked={useCustomSecret} onCheckedChange={setUseCustomSecret} />
                    <Label>Use custom secret key</Label>
                  </div>
                  {useCustomSecret && (
                    <div className="space-y-2">
                      <Label>Custom Secret Key (Base32)</Label>
                      <Input value={customSecret} onChange={(e) => setCustomSecret(e.target.value.toUpperCase())} placeholder="e.g., JBSWY3DPEHPK3PXP" className="font-mono" />
                    </div>
                  )}
                  <Button onClick={handleSetup2FA} disabled={twoFALoading} className="bg-violet-600 hover:bg-violet-700">
                    {twoFALoading ? <Loader2 className="mr-2 h-4 w-4 animate-spin" /> : <Shield className="mr-2 h-4 w-4" />}
                    Enable 2FA
                  </Button>
                </div>
              )}

              {/* ─── QR Code Display ─── */}
              {!twoFAEnabled && setupStep === "qr" && (
                <div className="space-y-4">
                  <div className="p-4 bg-violet-50 rounded-lg border border-violet-100 text-center">
                    <p className="text-sm text-violet-700 mb-3">Scan this QR code with your authenticator app:</p>
                    {qrCode && <img src={qrCode} alt="2FA QR Code" className="mx-auto w-48 h-48" />}
                    <Separator className="my-3" />
                    <p className="text-xs text-muted-foreground">Or enter this key manually:</p>
                    <div className="flex items-center justify-center gap-2 mt-1">
                      <code className="text-sm font-mono bg-white px-3 py-1 rounded border">{secretKey}</code>
                      <button onClick={() => copyToClipboard(secretKey)} className="text-violet-600 hover:text-violet-800">
                        {copiedCode === secretKey ? <Check className="h-4 w-4" /> : <Copy className="h-4 w-4" />}
                      </button>
                    </div>
                  </div>
                  <div className="space-y-2">
                    <Label>Enter verification code from your app</Label>
                    <Input value={verifyCode} onChange={(e) => setVerifyCode(e.target.value)} placeholder="6-digit code" className="text-center font-mono text-lg tracking-widest" maxLength={6} />
                  </div>
                  <div className="flex gap-3">
                    <Button variant="outline" onClick={() => { setSetupStep("idle"); setQrCode(""); setSecretKey(""); }}>
                      Cancel
                    </Button>
                    <Button onClick={handleVerify2FA} disabled={twoFALoading || verifyCode.length < 6} className="bg-violet-600 hover:bg-violet-700">
                      {twoFALoading ? <Loader2 className="mr-2 h-4 w-4 animate-spin" /> : null}
                      Verify & Enable
                    </Button>
                  </div>
                </div>
              )}

              {/* ─── 2FA Enabled State ─── */}
              {twoFAEnabled && (
                <div className="space-y-4">
                  {/* Backup codes */}
                  <div className="p-4 bg-gray-50 rounded-lg border space-y-3">
                    <div className="flex items-center justify-between">
                      <div className="flex items-center gap-2">
                        <KeyRound className="h-4 w-4 text-amber-600" />
                        <span className="text-sm font-medium">Backup Codes</span>
                        <Badge variant="outline" className="text-xs">{backupRemaining} remaining</Badge>
                      </div>
                      <div className="flex gap-2">
                        <Button variant="outline" size="sm" onClick={loadBackupCodes}>
                          <Eye className="h-3 w-3 mr-1" /> View
                        </Button>
                        <Button variant="outline" size="sm" onClick={regenerateBackupCodes}>
                          <RefreshCw className="h-3 w-3 mr-1" /> Regenerate
                        </Button>
                      </div>
                    </div>

                    {showBackupCodes && backupCodes.length > 0 && (
                      <div className="grid grid-cols-2 gap-2 mt-2">
                        {backupCodes.map((code) => (
                          <div key={code} className="flex items-center justify-between bg-white px-3 py-1.5 rounded border text-sm font-mono">
                            <span>{code}</span>
                            <button onClick={() => copyToClipboard(code)} className="text-gray-400 hover:text-gray-600 ml-2">
                              {copiedCode === code ? <Check className="h-3 w-3 text-green-500" /> : <Copy className="h-3 w-3" />}
                            </button>
                          </div>
                        ))}
                      </div>
                    )}
                  </div>

                  {/* Disable 2FA */}
                  <Separator />
                  <div className="space-y-3">
                    <h4 className="text-sm font-medium text-red-600">Disable Two-Factor Authentication</h4>
                    <div className="space-y-2">
                      <Input type="password" value={disablePassword} onChange={(e) => setDisablePassword(e.target.value)} placeholder="Current password" />
                      <Input value={disableCode} onChange={(e) => setDisableCode(e.target.value)} placeholder="Current TOTP code" className="font-mono" maxLength={6} />
                    </div>
                    <Button variant="destructive" size="sm" onClick={handleDisable2FA} disabled={disableLoading || !disablePassword || !disableCode}>
                      {disableLoading ? <Loader2 className="mr-2 h-4 w-4 animate-spin" /> : null}
                      Disable 2FA
                    </Button>
                  </div>
                </div>
              )}
            </CardContent>
          </Card>
        </TabsContent>
      </Tabs>
    </div>
  );
};
