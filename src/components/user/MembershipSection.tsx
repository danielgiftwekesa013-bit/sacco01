"use client";

import { useEffect, useState } from "react";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Badge } from "@/components/ui/badge";
import { CheckCircle2 } from "lucide-react";
import { supabase } from "@/lib/supabase";

interface MembershipData {
  memberSince: string;
  membershipFee: number;
  status: string;
  memberNumber: string;
}

const MembershipSection = () => {
  const [membershipData, setMembershipData] = useState<MembershipData | null>(null);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    const fetchMembership = async () => {
      setLoading(true);

      /* 1️⃣ Get logged-in user */
      const {
        data: { user },
        error: authError,
      } = await supabase.auth.getUser();

      if (authError || !user?.id) {
        console.error("Auth error or no user", authError);
        setLoading(false);
        return;
      }

      /* 2️⃣ Fetch profile (member no + registration date) */
      const { data: profile, error: profileError } = await supabase
        .from("userprofiles")
        .select("member_no, created_at")
        .eq("id", user.id)
        .single();

      if (profileError) {
        console.error("Error fetching profile:", profileError);
        setLoading(false);
        return;
      }

      /* 3️⃣ Fetch ALL membership rows (for total reg fee) */
      const { data: memberships, error: membershipError } = await supabase
        .from("membership")
        .select("reg_fee, status")
        .eq("member_id", user.id);

      if (membershipError) {
        console.error("Error fetching membership:", membershipError);
      }

      /* 4️⃣ Compute totals + status */
      const totalRegFee =
        memberships?.reduce(
          (sum, m) => sum + Number(m.reg_fee || 0),
          0
        ) ?? 0;

      const status =
        memberships && memberships.length > 0
          ? memberships[memberships.length - 1].status
          : "pending";

      setMembershipData({
        memberSince: new Date(profile.created_at).toLocaleDateString("en-KE", {
          year: "numeric",
          month: "long",
          day: "numeric",
        }),
        membershipFee: totalRegFee,
        status,
        memberNumber: profile.member_no,
      });

      setLoading(false);
    };

    fetchMembership();
  }, []);

  if (loading) {
    return <p>Loading membership data...</p>;
  }

  if (!membershipData) {
    return <p>No membership data found.</p>;
  }

  return (
    <div className="space-y-6">
      <div>
        <h2 className="text-3xl font-bold">Membership</h2>
        <p className="text-muted-foreground">
          Your membership details and status
        </p>
      </div>

      <Card>
        <CardHeader>
          <CardTitle>Membership Status</CardTitle>
        </CardHeader>
        <CardContent>
          <div className="flex items-center gap-4">
            <div className="flex h-16 w-16 items-center justify-center rounded-full bg-secondary/20">
              <CheckCircle2 className="h-8 w-8 text-secondary" />
            </div>
            <div>
              <Badge className="mb-2 bg-secondary">
                {membershipData.status === "paid"
                  ? "Active Member"
                  : "Pending"}
              </Badge>
              <p className="text-sm text-muted-foreground">
                Member since {membershipData.memberSince}
              </p>
            </div>
          </div>
        </CardContent>
      </Card>

      <div className="grid gap-4 md:grid-cols-2">
        <Card>
          <CardHeader>
            <CardTitle className="text-sm">Member Number</CardTitle>
          </CardHeader>
          <CardContent>
            <p className="text-2xl font-bold">
              {membershipData.memberNumber}
            </p>
          </CardContent>
        </Card>

        <Card>
          <CardHeader>
            <CardTitle className="text-sm">
              Membership Fee Paid
            </CardTitle>
          </CardHeader>
          <CardContent>
            <p className="text-2xl font-bold">
              KSh {membershipData.membershipFee.toLocaleString()}
            </p>
          </CardContent>
        </Card>
      </div>

      <Card>
        <CardHeader>
          <CardTitle>Membership Benefits</CardTitle>
        </CardHeader>
        <CardContent>
          <ul className="space-y-2">
            <li className="flex items-start gap-2">
              <CheckCircle2 className="mt-0.5 h-5 w-5 text-secondary" />
              <span>Access to all loan products</span>
            </li>
            <li className="flex items-start gap-2">
              <CheckCircle2 className="mt-0.5 h-5 w-5 text-secondary" />
              <span>Earn dividends on shares</span>
            </li>
            <li className="flex items-start gap-2">
              <CheckCircle2 className="mt-0.5 h-5 w-5 text-secondary" />
              <span>Welfare support and benefits</span>
            </li>
            <li className="flex items-start gap-2">
              <CheckCircle2 className="mt-0.5 h-5 w-5 text-secondary" />
              <span>Voting rights in AGM</span>
            </li>
          </ul>
        </CardContent>
      </Card>
    </div>
  );
};

export default MembershipSection;
