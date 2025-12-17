import { useEffect, useState, useRef } from "react";
import {
  Dialog,
  DialogContent,
  DialogHeader,
  DialogTitle,
} from "@/components/ui/dialog";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { supabase } from "@/lib/supabase";

interface Props {
  open: boolean;
  onOpenChange: (v: boolean) => void;
}

interface Profile {
  user_name: string;
  email_address: string;
  phone?: string;
  member_no?: string;
  id_no?: string;
  role: string;
}

const ProfileModal = ({ open, onOpenChange }: Props) => {
  const [loading, setLoading] = useState(false);
  const [profile, setProfile] = useState<Profile | null>(null);
  const [editing, setEditing] = useState(false);

  const [assignEmail, setAssignEmail] = useState("");
  const mountedRef = useRef(false);

  /** ---------------------------
   * Prevent stale state updates
   * --------------------------*/
  useEffect(() => {
    mountedRef.current = true;
    return () => {
      mountedRef.current = false;
    };
  }, []);

  /** ---------------------------
   * Fetch on open, RESET on close
   * --------------------------*/
  useEffect(() => {
    if (open) {
      fetchProfile();
    } else {
      // 🔴 CRITICAL FIX
      setProfile(null);
      setEditing(false);
      setAssignEmail("");
      setLoading(false);
    }
  }, [open]);

  async function fetchProfile() {
    setLoading(true);
    try {
      const { data: { user }, error } = await supabase.auth.getUser();
      if (error || !user) return;

      // Try member profile first
      const { data: member } = await supabase
        .from("userprofiles")
        .select("*")
        .eq("id", user.id)
        .maybeSingle();

      if (member && mountedRef.current) {
        setProfile({
          user_name: member.user_name,
          email_address: member.email_address,
          phone: member.phone,
          member_no: member.member_no,
          id_no: member.id_no,
          role: member.role ?? "member",
        });
        return;
      }

      // Else fetch official
      const { data: admin } = await supabase
        .from("officials")
        .select("name, email_address, role")
        .eq("email_address", user.email)
        .maybeSingle();

      if (admin && mountedRef.current) {
        setProfile({
          user_name: admin.name,
          email_address: admin.email_address,
          role: admin.role,
        });
      }
    } catch (err) {
      console.error("Profile fetch error:", err);
    } finally {
      if (mountedRef.current) setLoading(false);
    }
  }

  async function updateProfile() {
    if (!profile || profile.role !== "member") return;
    setLoading(true);

    try {
      const { data: { user } } = await supabase.auth.getUser();
      if (!user) return;

      await supabase
        .from("userprofiles")
        .update({
          user_name: profile.user_name,
          phone: profile.phone,
        })
        .eq("id", user.id);
    } finally {
      if (mountedRef.current) {
        setEditing(false);
        setLoading(false);
      }
    }
  }

  /** ---------------------------
   * Assign secretary / treasurer
   * --------------------------*/
  async function assignRole(role: "secretary" | "treasurer") {
    if (!assignEmail) {
      alert("Enter member email");
      return;
    }

    const { data: member } = await supabase
      .from("userprofiles")
      .select("user_name, email_address")
      .eq("email_address", assignEmail)
      .maybeSingle();

    if (!member) {
      alert("Member not found");
      return;
    }

    const { error } = await supabase.from("officials").insert({
      name: member.user_name,
      email_address: member.email_address,
      role,
    });

    if (error) {
      console.error(error);
      alert("Failed to assign role");
    } else {
      alert(`${role} assigned successfully`);
      setAssignEmail("");
    }
  }

  if (loading) {
    return <div className="p-8 text-center text-muted-foreground">Loading...</div>;
  }

  const isChairman = profile?.role === "chairman";
  const isMember = profile?.role === "member";

  return (
    <Dialog open={open} onOpenChange={onOpenChange}>
      <DialogContent className="max-w-md">
        <DialogHeader>
          <DialogTitle>Profile</DialogTitle>
        </DialogHeader>

        {!profile ? (
          <div className="text-center py-8 text-muted-foreground">
            Loading profile…
          </div>
        ) : (
          <div className="space-y-4">
            {isChairman && (
              <div className="p-3 border rounded bg-gray-50">
                <h2 className="font-semibold mb-2">Admin Actions</h2>

                <Label>Member Email</Label>
                <Input
                  value={assignEmail}
                  onChange={(e) => setAssignEmail(e.target.value)}
                  placeholder="member@email.com"
                />

                <div className="flex gap-2 mt-3">
                  <Button onClick={() => assignRole("treasurer")}>
                    Make Treasurer
                  </Button>
                  <Button onClick={() => assignRole("secretary")}>
                    Make Secretary
                  </Button>
                </div>
              </div>
            )}

            {isMember && (
              <>
                <div>
                  <Label>Member No</Label>
                  <div className="p-2 bg-gray-100 rounded">
                    {profile.member_no}
                  </div>
                </div>

                <div>
                  <Label>ID Number</Label>
                  <div className="p-2 bg-gray-100 rounded">
                    {profile.id_no}
                  </div>
                </div>
              </>
            )}

            <div>
              <Label>Name</Label>
              <Input
                value={profile.user_name}
                disabled={!isMember || !editing}
                onChange={(e) =>
                  setProfile({ ...profile, user_name: e.target.value })
                }
              />
            </div>

            <div>
              <Label>Phone</Label>
              <Input
                value={profile.phone || ""}
                disabled={!isMember || !editing}
                onChange={(e) =>
                  setProfile({ ...profile, phone: e.target.value })
                }
              />
            </div>

            {isMember && (
              <div className="flex justify-between mt-3">
                {!editing ? (
                  <Button onClick={() => setEditing(true)}>Edit Profile</Button>
                ) : (
                  <>
                    <Button
                      variant="secondary"
                      onClick={() => setEditing(false)}
                    >
                      Cancel
                    </Button>
                    <Button onClick={updateProfile}>Save</Button>
                  </>
                )}
              </div>
            )}
          </div>
        )}
      </DialogContent>
    </Dialog>
  );
};

export default ProfileModal;
