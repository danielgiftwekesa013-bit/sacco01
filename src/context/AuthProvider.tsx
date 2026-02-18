// src/context/AuthProvider.tsx
import { createContext, useContext, useEffect, useState } from "react";
import { supabase } from "@/lib/supabase";

interface AuthContextType {
  user: any; // your actual member info from userprofiles
  loading: boolean;
  login: (member_no: string, id_no: string) => Promise<void>;
  signOut: () => Promise<void>;
}

const AuthContext = createContext<AuthContextType>({
  user: null,
  loading: true,
  login: async () => {},
  signOut: async () => {},
});

export const AuthProvider = ({ children }: { children: React.ReactNode }) => {
  const [user, setUser] = useState<any>(null);
  const [loading, setLoading] = useState(true);

  // Initialize Supabase session
  useEffect(() => {
    const init = async () => {
      const { data } = await supabase.auth.getSession();
      if (data.session) {
        // Optionally fetch your member profile linked to this email
        const { data: member } = await supabase
          .from("userprofiles")
          .select("*")
          .eq("email_address", data.session.user.email)
          .single();
        setUser(member);
      }
      setLoading(false);
    };
    init();

    const { data: listener } = supabase.auth.onAuthStateChange(async (_event, session) => {
      if (session?.user) {
        const { data: member } = await supabase
          .from("userprofiles")
          .select("*")
          .eq("email_address", session.user.email)
          .single();
        setUser(member);
      } else {
        setUser(null);
      }
    });

    return () => listener.subscription.unsubscribe();
  }, []);

  // 🔥 Login only checks for existing accounts
  const login = async (member_no: string, id_no: string) => {
    setLoading(true);

    try {
      // 1️⃣ Check the member exists in userprofiles
      const { data: member, error } = await supabase
        .from("userprofiles")
        .select("*")
        .eq("member_no", member_no.toUpperCase())
        .eq("id_no", id_no)
        .single();

      if (error || !member) throw new Error("Invalid member_no or ID number");

      // 2️⃣ Ensure the member has an email registered in Supabase Auth
      if (!member.email_address) throw new Error("No login email found. Contact admin.");

      // 3️⃣ Sign in using the email in Supabase Auth
      const { error: loginError } = await supabase.auth.signInWithPassword({
        email: member.email_address,
        password: id_no, // ID number as password
      });

      if (loginError) throw loginError;

      // 4️⃣ Set your member info in context
      setUser(member);

    } catch (err: any) {
      throw new Error(err.message || "Login failed");
    } finally {
      setLoading(false);
    }
  };

  const signOut = async () => {
    await supabase.auth.signOut();
    setUser(null);
  };

  return (
    <AuthContext.Provider value={{ user, loading, login, signOut }}>
      {children}
    </AuthContext.Provider>
  );
};

export const useAuth = () => useContext(AuthContext);
