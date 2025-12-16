import { useState } from "react";
import { Dialog, DialogContent, DialogHeader, DialogTitle } from "@/components/ui/dialog";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { supabase } from "@/lib/supabase";

interface Props {
  open: boolean;
  onOpenChange: (v: boolean) => void;
}

const SettingsModal = ({ open, onOpenChange }: Props) => {
  const [oldPassword, setOldPassword] = useState("");
  const [newPassword, setNewPassword] = useState("");
  const [confirm, setConfirm] = useState("");
  const [loading, setLoading] = useState(false);
  const [err, setErr] = useState("");

  async function handleChangePassword() {
    setErr("");

    if (newPassword !== confirm) {
      setErr("Passwords do not match");
      return;
    }

    setLoading(true);

    const { data: { user } } = await supabase.auth.getUser();

    const { error: signInErr } = await supabase.auth.signInWithPassword({
      email: user?.email!,
      password: oldPassword,
    });

    if (signInErr) {
      setErr("Old password is incorrect");
      setLoading(false);
      return;
    }

    await supabase.auth.updateUser({ password: newPassword });

    setLoading(false);
    onOpenChange(false);
  }

  return (
    <Dialog open={open} onOpenChange={onOpenChange}>
      <DialogContent className="max-w-md">
        <DialogHeader>
          <DialogTitle>Change Password</DialogTitle>
        </DialogHeader>

        <div className="space-y-4">
          {err && <div className="text-red-500 text-sm">{err}</div>}

          <div>
            <Label>Old Password</Label>
            <Input
              type="password"
              value={oldPassword}
              onChange={(e) => setOldPassword(e.target.value)}
            />
          </div>

          <div>
            <Label>New Password</Label>
            <Input
              type="password"
              value={newPassword}
              onChange={(e) => setNewPassword(e.target.value)}
            />
          </div>

          <div>
            <Label>Confirm Password</Label>
            <Input
              type="password"
              value={confirm}
              onChange={(e) => setConfirm(e.target.value)}
            />
          </div>

          <Button
            className="w-full"
            disabled={loading}
            onClick={handleChangePassword}
          >
            Update Password
          </Button>
        </div>
      </DialogContent>
    </Dialog>
  );
};

export default SettingsModal;
