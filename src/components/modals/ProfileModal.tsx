import { useEffect, useState } from "react";
import { Dialog, DialogContent, DialogHeader, DialogTitle } from "@/components/ui/dialog";
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

  useEffect(() => {
    if (open) fetchProfile();
  }, [open]);

  // Unified fetch
  async function fetchProfile() {
    setLoading(true);
    try {
      const { data: { user }, error: userError } = await supabase.auth.getUser();
      if (userError) throw userError;
      if (!user) return;

      console.log("Logged in user:", user);

      // Try member first
      const { data: member, error: memberError } = await supabase
        .from("userprofiles")
        .select("*")
        .eq("id", user.id)
        .maybeSingle();

      if (memberError) console.error("Member fetch error:", memberError);

      if (member) {
        setProfile({
          user_name: member.user_name,
          email_address: member.email_address,
          phone: member.phone,
          member_no: member.member_no,
          id_no: member.id_no,
          role: member.role ?? "member",
        });
      } else {
        // If not a member, fetch admin
        const { data: admin, error: adminError } = await supabase
          .from("officials")
          .select("name, email_address, role")
          .eq("email_address", user.email)
          .maybeSingle();

        if (adminError) console.error("Admin fetch error:", adminError);

        if (admin) {
          setProfile({
            user_name: admin.name,
            email_address: admin.email_address,
            phone: "", // no phone for admin table
            role: admin.role,
          });
        } else {
          setProfile(null);
        }
      }
    } catch (err) {
      console.error("Error fetching profile:", err);
    } finally {
      setLoading(false);
    }
  }

  async function updateProfile() {
    if (!profile || profile.role !== "member") return;

    setLoading(true);
    try {
      const { data: { user } } = await supabase.auth.getUser();
      if (!user) return;

      const { error } = await supabase
        .from("userprofiles")
        .update({
          user_name: profile.user_name,
          phone: profile.phone,
        })
        .eq("id", user.id);

      if (error) console.error("Update error:", error);
    } finally {
      setEditing(false);
      setLoading(false);
    }
  }

  async function assignRole(newRole: "treasurer" | "secretary") {
    if (!profile || profile.role !== "chairman") {
      alert("Only chairman can assign roles!");
      return;
    }

    const { error } = await supabase.from("officials").insert({
      name: profile.user_name,
      email_address: profile.email_address,
      role: newRole,
    });

    if (error) {
      console.error("Assign role error:", error);
      alert("Error assigning role");
    } else {
      alert(`${newRole} assigned successfully!`);
    }
  }

  if (loading) return <div className="p-8 text-center text-muted-foreground">Loading...</div>;
  // REMOVED THE "No profile found" return

  const isAdmin = profile && ["chairman", "treasurer", "secretary"].includes(profile.role);
  const isChairman = profile && profile.role === "chairman";
  const isMember = profile && profile.role === "member";

  return (
    <Dialog open={open} onOpenChange={onOpenChange}>
      <DialogContent className="max-w-md">
        <DialogHeader>
          <DialogTitle>
            {profile ? (isAdmin ? "User Profile (Admin View)" : "My Profile") : "Profile"}
          </DialogTitle>
        </DialogHeader>

        {!profile ? (
          <div className="text-center text-muted-foreground py-10">
            <p>Loading profile details...</p>
          </div>
        ) : (
          <div className="space-y-4">
            {isChairman && (
              <div className="p-3 border rounded bg-gray-50">
                <h2 className="font-semibold mb-2">Admin Actions</h2>
                <div>
                  <Label>Email</Label>
                  <div className="p-2 bg-white border rounded">{profile.email_address}</div>
                </div>
                <div>
                  <Label>Phone</Label>
                  <div className="p-2 bg-white border rounded">{profile.phone || "N/A"}</div>
                </div>
                <div className="mt-3">
                  <Label>Assign SACCO Roles</Label>
                  <div className="flex gap-2 mt-2">
                    <Button onClick={() => assignRole("treasurer")}>Make Treasurer</Button>
                    <Button onClick={() => assignRole("secretary")}>Make Secretary</Button>
                  </div>
                </div>
              </div>
            )}

            {isMember && (
              <>
                <div>
                  <Label>Member No</Label>
                  <div className="p-2 bg-gray-100 rounded">{profile.member_no}</div>
                </div>
                <div>
                  <Label>ID Number</Label>
                  <div className="p-2 bg-gray-100 rounded">{profile.id_no}</div>
                </div>
              </>
            )}

            <div>
              <Label>Name</Label>
              <Input
                value={profile.user_name}
                disabled={!isMember || !editing}
                onChange={(e) => setProfile({ ...profile, user_name: e.target.value })}
              />
            </div>

            <div>
              <Label>Phone</Label>
              <Input
                value={profile.phone || ""}
                disabled={!isMember || !editing}
                onChange={(e) => setProfile({ ...profile, phone: e.target.value })}
              />
            </div>

            {isMember && (
              <div className="flex justify-between mt-3">
                {!editing ? (
                  <Button onClick={() => setEditing(true)}>Edit Profile</Button>
                ) : (
                  <>
                    <Button onClick={() => setEditing(false)} variant="secondary">Cancel</Button>
                    <Button onClick={updateProfile} disabled={loading}>Save Changes</Button>
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
