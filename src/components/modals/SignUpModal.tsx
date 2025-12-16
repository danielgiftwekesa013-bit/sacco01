import { useState } from "react";
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

interface SignUpModalProps {
  open: boolean;
  onOpenChange: (open: boolean) => void;
  onLogin: () => void;
}

const SignUpModal = ({ open, onOpenChange, onLogin }: SignUpModalProps) => {
  const initialFormData = {
    fullName: "",
    email: "",
    phone: "",
    idNumber: "",
    memberNo: "",
    password: "",
    confirmPassword: "",
  };

  const [formData, setFormData] = useState(initialFormData);
  const [loading, setLoading] = useState(false);

  // ✅ Validate member number (TPSK-XXXX)
  const isValidMemberNo = (memberNo: string) => {
    return /^TPSK-[A-Z0-9]{4}$/.test(memberNo);
  };

  const handleSignUp = async (e: React.FormEvent) => {
    e.preventDefault();

    if (!isValidMemberNo(formData.memberNo)) {
      toast.error(
        "Invalid Member Number. Use format TPSK-XXXX (X are capital letters or digits)."
      );
      return;
    }

    if (formData.password !== formData.confirmPassword) {
      toast.error("Passwords do not match");
      return;
    }

    try {
      setLoading(true);

      // ✅ 1. Create user in Supabase Auth
      const { data: authData, error: authError } = await supabase.auth.signUp({
        email: formData.email,
        password: formData.password,
        options: {
          data: {
            full_name: formData.fullName,
            phone: formData.phone,
            id_no: formData.idNumber,
            member_no: formData.memberNo,
            role: "member",
          },
        },
      });

      if (authError) throw authError;

      const userId = authData.user?.id;
      if (!userId) throw new Error("User ID not returned from Supabase");

      // ✅ 2. Insert into userprofiles
      const { error: profileError } = await supabase.from("userprofiles").insert([
        {
          id: userId,
          user_name: formData.fullName,
          email_address: formData.email,
          phone: formData.phone,
          id_no: formData.idNumber,
          member_no: formData.memberNo,
          role: "member",
        },
      ]);

      if (profileError) throw profileError;

      // ✅ 3. Insert into membership
      const { error: membershipError } = await supabase.from("membership").insert([
        {
          member_id: userId,
          member_no: formData.memberNo,
          reg_fee: 0.0,
          status: "pending",
        },
      ]);

      if (membershipError) throw membershipError;

      toast.success(
        "Account created successfully! Please check your email to verify your account."
      );

      // ✅ Reset form and close modal
      setFormData(initialFormData);
      onOpenChange(false);
      onLogin();
    } catch (error: any) {
      console.error("Signup Error:", error);
      toast.error(error.message || "Failed to create account. Please try again.");
    } finally {
      setLoading(false);
    }
  };

  return (
    <Dialog open={open} onOpenChange={onOpenChange}>
      <DialogContent
        className="sm:max-w-md max-h-[90vh] overflow-y-auto p-6 rounded-xl"
      >
        <DialogHeader>
          <DialogTitle>Create Account</DialogTitle>
          <DialogDescription>
            Join Trans Piaggio Sacco Kitale today.
        
          </DialogDescription>
        </DialogHeader>

        <form onSubmit={handleSignUp} className="space-y-4">
          <div className="space-y-2">
            <Label htmlFor="fullName">Full Name</Label>
            <Input
              id="fullName"
              value={formData.fullName}
              onChange={(e) =>
                setFormData({ ...formData, fullName: e.target.value })
              }
              placeholder="Enter your full name"
              required
            />
          </div>

          <div className="space-y-2">
            <Label htmlFor="email">Email</Label>
            <Input
              id="email"
              type="email"
              value={formData.email}
              onChange={(e) =>
                setFormData({ ...formData, email: e.target.value })
              }
              placeholder="Enter your email"
              required
            />
          </div>

          <div className="space-y-2">
            <Label htmlFor="phone">Phone Number</Label>
            <Input
              id="phone"
              type="tel"
              value={formData.phone}
              onChange={(e) =>
                setFormData({ ...formData, phone: e.target.value })
              }
              placeholder="+254 7xx xxx xxx"
              required
            />
          </div>

          <div className="space-y-2">
            <Label htmlFor="idNumber">National ID Number</Label>
            <Input
              id="idNumber"
              type="text"
              value={formData.idNumber}
              onChange={(e) =>
                setFormData({ ...formData, idNumber: e.target.value })
              }
              placeholder="Enter your national ID number"
              required
            />
          </div>

          <div className="space-y-2">
            <Label htmlFor="memberNo">Member Number</Label>
            <Input
              id="memberNo"
              value={formData.memberNo}
              onChange={(e) =>
                setFormData({ ...formData, memberNo: e.target.value.toUpperCase() })
              }
              placeholder="TPSK-XXXX (e.g. TPSK-42KX)"
              required
            />
            <p className="text-xs text-muted-foreground">
              Format: TPSK-XXXX (X are capital letters or numbers)
            </p>
          </div>

          <div className="space-y-2">
            <Label htmlFor="signup-password">Password</Label>
            <Input
              id="signup-password"
              type="password"
              value={formData.password}
              onChange={(e) =>
                setFormData({ ...formData, password: e.target.value })
              }
              placeholder="Create a secure password"
              required
            />
          </div>

          <div className="space-y-2">
            <Label htmlFor="confirmPassword">Confirm Password</Label>
            <Input
              id="confirmPassword"
              type="password"
              value={formData.confirmPassword}
              onChange={(e) =>
                setFormData({ ...formData, confirmPassword: e.target.value })
              }
              placeholder="Confirm your password"
              required
            />
          </div>

          <Button
            type="submit"
            className="w-full bg-gradient-primary"
            disabled={loading}
          >
            {loading ? "Creating Account..." : "Create Account"}
          </Button>

          <p className="text-center text-sm text-muted-foreground">
            Already have an account?{" "}
            <Button
              type="button"
              variant="link"
              className="px-1"
              onClick={onLogin}
            >
              Sign In
            </Button>
          </p>
        </form>
      </DialogContent>
    </Dialog>
  );
};

export default SignUpModal;
