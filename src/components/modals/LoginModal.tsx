import { useState } from "react";
import { useNavigate } from "react-router-dom";
import {
  Dialog,
  DialogContent,
  DialogDescription,
  DialogHeader,
  DialogTitle,
} from "@/components/ui/dialog";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Button } from "@/components/ui/button";
import { toast } from "sonner";
import { supabase } from "@/lib/supabase";

interface LoginModalProps {
  open: boolean;
  onOpenChange: (open: boolean) => void;
  onForgotPassword: () => void;
  onSignUp: () => void;
}

const LoginModal = ({
  open,
  onOpenChange,
  onForgotPassword,
  onSignUp,
}: LoginModalProps) => {
  const [username, setUsername] = useState("");
  const [password, setPassword] = useState("");
  const [loading, setLoading] = useState(false);
  const navigate = useNavigate();

  const handleLogin = async (e: React.FormEvent) => {
    e.preventDefault();

    if (!username || !password) {
      toast.error("Please enter both username and password");
      return;
    }

    try {
      setLoading(true);

      let emailToUse = username;

      // ✅ Check if input is a member number (TPSK-XXXX)
      if (/^TPSK-[A-Z0-9]{4}$/.test(username.toUpperCase())) {
        const { data, error } = await supabase
          .from("userprofiles")
          .select("email_address")
          .eq("member_no", username.toUpperCase())
          .single();

        if (error || !data) {
          toast.error("No user found with that member number.");
          setLoading(false);
          return;
        }

        emailToUse = data.email_address;
      }

      // ✅ Attempt Supabase login
      const { error: loginError } = await supabase.auth.signInWithPassword({
        email: emailToUse,
        password,
      });

      if (loginError) {
        toast.error(loginError.message || "Invalid login credentials");
        return;
      }

      toast.success("Login successful!");
      onOpenChange(false);
      navigate("/dashboard");
    } catch (error: any) {
      console.error("Login Error:", error);
      toast.error("An error occurred during login. Please try again.");
    } finally {
      setLoading(false);
    }
  };

  return (
    <Dialog open={open} onOpenChange={onOpenChange}>
      <DialogContent className="sm:max-w-md max-h-[90vh] overflow-y-auto rounded-xl p-6">
        <DialogHeader>
          <DialogTitle>Sign In</DialogTitle>
          <DialogDescription>
            Enter your credentials to access your account.
          </DialogDescription>
        </DialogHeader>

        <form onSubmit={handleLogin} className="space-y-4">
          <div className="space-y-2">
            <Label htmlFor="username">Email or Member Number</Label>
            <Input
              id="username"
              value={username}
              onChange={(e) => setUsername(e.target.value)}
              placeholder="Enter your email or member number (e.g. TPSK-42KX)"
              required
            />
          </div>

          <div className="space-y-2">
            <Label htmlFor="password">Password</Label>
            <Input
              id="password"
              type="password"
              value={password}
              onChange={(e) => setPassword(e.target.value)}
              placeholder="Enter your password"
              required
            />
          </div>

          <Button
            type="button"
            variant="link"
            className="px-0 text-sm"
            onClick={onForgotPassword}
          >
            Forgot Password?
          </Button>

          <Button
            type="submit"
            className="w-full bg-gradient-primary"
            disabled={loading}
          >
            {loading ? "Signing In..." : "Sign In"}
          </Button>

          <p className="text-center text-sm text-muted-foreground">
            Don't have an account?{" "}
            <Button
              type="button"
              variant="link"
              className="px-1"
              onClick={onSignUp}
            >
              Create Account
            </Button>
          </p>
        </form>
      </DialogContent>
    </Dialog>
  );
};

export default LoginModal;
