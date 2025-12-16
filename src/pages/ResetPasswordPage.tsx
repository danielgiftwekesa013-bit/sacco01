import { useState } from "react";
import { useNavigate } from "react-router-dom";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Button } from "@/components/ui/button";
import { toast } from "sonner";
import { supabase } from "@/lib/supabase";

const ResetPasswordPage = () => {
  const [formData, setFormData] = useState({
    password: "",
    confirmPassword: "",
  });
  const [loading, setLoading] = useState(false);
  const navigate = useNavigate();

  const handlePasswordReset = async (e: React.FormEvent) => {
    e.preventDefault();

    if (!formData.password || !formData.confirmPassword) {
      toast.error("Please fill in both password fields");
      return;
    }

    if (formData.password !== formData.confirmPassword) {
      toast.error("Passwords do not match");
      return;
    }

    try {
      setLoading(true);

      // ✅ Update password using Supabase auth
      const { error } = await supabase.auth.updateUser({
        password: formData.password,
      });

      if (error) throw error;

      toast.success("Password updated successfully! Please sign in again.");
      setFormData({ password: "", confirmPassword: "" });

      // Redirect to login page after success
      setTimeout(() => navigate("/"), 1500);
    } catch (error: any) {
      console.error("Reset Password Error:", error);
      toast.error(error.message || "Failed to reset password. Try again.");
    } finally {
      setLoading(false);
    }
  };

  return (
    <div className="min-h-screen flex items-center justify-center bg-background px-4 py-8">
      <div className="w-full max-w-md bg-card p-8 rounded-2xl shadow-md space-y-6 border border-border">
        <div className="text-center space-y-2">
          <h1 className="text-2xl font-semibold text-foreground">
            Reset Your Password
          </h1>
          <p className="text-sm text-muted-foreground">
            Enter and confirm your new password below.
          </p>
        </div>

        <form onSubmit={handlePasswordReset} className="space-y-4">
          <div className="space-y-2">
            <Label htmlFor="newPassword">New Password</Label>
            <Input
              id="newPassword"
              type="password"
              value={formData.password}
              onChange={(e) =>
                setFormData({ ...formData, password: e.target.value })
              }
              placeholder="Enter new password"
              required
            />
          </div>

          <div className="space-y-2">
            <Label htmlFor="confirmPassword">Confirm New Password</Label>
            <Input
              id="confirmPassword"
              type="password"
              value={formData.confirmPassword}
              onChange={(e) =>
                setFormData({
                  ...formData,
                  confirmPassword: e.target.value,
                })
              }
              placeholder="Confirm new password"
              required
            />
          </div>

          <Button
            type="submit"
            className="w-full bg-gradient-primary"
            disabled={loading}
          >
            {loading ? "Updating..." : "Update Password"}
          </Button>

          <Button
            type="button"
            variant="link"
            className="w-full text-sm text-center"
            onClick={() => navigate("/")}
          >
            Back to Sign In
          </Button>
        </form>
      </div>
    </div>
  );
};

export default ResetPasswordPage;
