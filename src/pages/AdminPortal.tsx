import { useEffect, useState } from "react";
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
import AdminDashboardLayout from "@/components/admin/AdminDashboardLayout";

const AdminPortal = () => {
  const [email, setEmail] = useState("");
  const [password, setPassword] = useState("");
  const [user, setUser] = useState<any>(null);
  const [role, setRole] = useState<string | null>(null);
  const [loading, setLoading] = useState(true);
  const navigate = useNavigate();

  const fetchRole = async (email: string) => {
    const { data, error } = await supabase
      .from("officials")
      .select("role")
      .eq("email_address", email)
      .maybeSingle();

    if (error) {
      console.error(error);
      return null;
    }

    return data?.role ?? null;
  };

  useEffect(() => {
    let mounted = true;

    const init = async () => {
      setLoading(true);

      // ✅ USE getSession (not getUser)
      const {
        data: { session },
      } = await supabase.auth.getSession();

      if (!mounted) return;

      if (!session?.user) {
        setUser(null);
        setRole(null);
        setLoading(false);
        return;
      }

      setUser(session.user);

      if (session.user.email) {
        const userRole = await fetchRole(session.user.email);

        if (
          !userRole ||
          !["chairman", "secretary", "treasurer"].includes(userRole)
        ) {
          await supabase.auth.signOut();
          setUser(null);
          setRole(null);
          toast.error("Unauthorized role");
        } else {
          setRole(userRole);
        }
      }

      setLoading(false);
    };

    init();

    // Listen to auth changes
    const {
      data: { subscription },
    } = supabase.auth.onAuthStateChange((_event, session) => {
      if (!session?.user) {
        setUser(null);
        setRole(null);
      } else {
        setUser(session.user);
      }
    });

    return () => {
      mounted = false;
      subscription.unsubscribe();
    };
  }, []);

  const handleLogin = async (e: React.FormEvent) => {
    e.preventDefault();
    setLoading(true);

    const { data, error } = await supabase.auth.signInWithPassword({
      email,
      password,
    });

    if (error) {
      toast.error("Login failed: " + error.message);
      setLoading(false);
      return;
    }

    if (!data.user?.email) {
      toast.error("Invalid login");
      setLoading(false);
      return;
    }

    const userRole = await fetchRole(data.user.email);

    if (
      !userRole ||
      !["chairman", "secretary", "treasurer"].includes(userRole)
    ) {
      toast.error("Unauthorized role");
      await supabase.auth.signOut();
      setLoading(false);
      return;
    }

    setRole(userRole);
    setUser(data.user);
    toast.success("Welcome back!");
    setLoading(false);
  };

  const handleLogout = async () => {
    await supabase.auth.signOut();
    setUser(null);
    setRole(null);
    navigate("/");
  };

  if (loading) {
    return (
      <div className="p-8 text-center text-muted-foreground">
        Loading...
      </div>
    );
  }

  if (!user) {
    return (
      <Dialog open={true}>
        <DialogContent className="sm:max-w-md">
          <DialogHeader>
            <DialogTitle>Admin Portal Login</DialogTitle>
            <DialogDescription>
              Sign in to access the portal
            </DialogDescription>
          </DialogHeader>

          <form onSubmit={handleLogin} className="space-y-4">
            <div className="space-y-2">
              <Label htmlFor="email">Email</Label>
              <Input
                id="email"
                type="email"
                value={email}
                onChange={(e) => setEmail(e.target.value)}
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
                required
              />
            </div>

            <div className="flex gap-2">
              <Button
                type="submit"
                disabled={loading}
                className="flex-1 bg-gradient-primary"
              >
                {loading ? "Signing in..." : "Sign In"}
              </Button>
              <Button
                type="button"
                variant="outline"
                onClick={() => navigate("/")}
              >
                Cancel
              </Button>
            </div>
          </form>
        </DialogContent>
      </Dialog>
    );
  }

  return <AdminDashboardLayout onLogout={handleLogout} role={role} />;
};

export default AdminPortal;