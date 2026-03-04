"use client";

import { useEffect, useState } from "react";
import { supabase } from "@/lib/supabase";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Badge } from "@/components/ui/badge";
import { Tabs, TabsContent, TabsList, TabsTrigger } from "@/components/ui/tabs";

const PAGE_SIZE = 10;

const AdminWelfare = () => {
  const [members, setMembers] = useState<any[]>([]);
  const [tab, setTab] = useState("active");

  const [summaryTotal, setSummaryTotal] = useState(0);

  /* ---------------- SUBSCRIPTION ---------------- */
  const [showSub, setShowSub] = useState(false);
  const [memberNo, setMemberNo] = useState("");
  const [regStatus, setRegStatus] = useState("Active");

  /* ---------------- ACTIVE MEMBERS ---------------- */
  const [activeMembers, setActiveMembers] = useState<any[]>([]);
  const [pageActive, setPageActive] = useState(1);
  const [totalActivePages, setTotalActivePages] = useState(1);

  /* ---------------- CONTRIBUTIONS ---------------- */
  const [contributions, setContributions] = useState<any[]>([]);
  const [pageContrib, setPageContrib] = useState(1);
  const [totalContribPages, setTotalContribPages] = useState(1);
  const [filterDate, setFilterDate] = useState("");
  const [filterMemberNo, setFilterMemberNo] = useState("");

  /* -------------------------------------------------- */
  const fetchMembers = async () => {
    const { data } = await supabase
      .from("userprofiles")
      .select("id, user_name, member_no");

    setMembers(data || []);
  };

  /* --------------------------------------------------
     SUMMARY TOTAL (LATEST PER MEMBER)
  -------------------------------------------------- */
  const computeSummaryTotal = async () => {
    const { data } = await supabase
      .from("wellfare")
      .select("*")
      .order("created_at", { ascending: false });

    const latestMap = new Map<string, any>();

    (data || []).forEach((r) => {
      const existing = latestMap.get(r.member_id);
      if (
        !existing ||
        new Date(r.created_at) > new Date(existing.created_at)
      ) {
        latestMap.set(r.member_id, r);
      }
    });

    const total = Array.from(latestMap.values()).reduce(
      (sum, r) => sum + Number(r.total_wellfare || 0),
      0
    );

    setSummaryTotal(total);
  };

  /* --------------------------------------------------
     ACTIVATE / DEACTIVATE (UPDATE INSTEAD OF DUPLICATE)
  -------------------------------------------------- */
  const updateRegStatus = async () => {
    if (!memberNo) return alert("Enter Member Number");

    const { data: member } = await supabase
      .from("userprofiles")
      .select("id")
      .eq("member_no", memberNo)
      .single();

    if (!member) return alert("Member not found");

    const { data: existing } = await supabase
      .from("wellfare")
      .select("*")
      .eq("member_id", member.id)
      .order("created_at", { ascending: false })
      .limit(1)
      .single();

    if (existing) {
      await supabase
        .from("wellfare")
        .update({ reg_status: regStatus })
        .eq("id", existing.id);
    } else {
      await supabase.from("wellfare").insert({
        member_id: member.id,
        amount: 0,
        reg_status: regStatus,
        status: "paid",
      });
    }

    alert("Welfare Registration Updated");
    setMemberNo("");
    setShowSub(false);

    fetchActiveMembers();
    computeSummaryTotal();
  };

  /* --------------------------------------------------
     ACTIVE MEMBERS TAB
  -------------------------------------------------- */
  const fetchActiveMembers = async () => {
    const { data } = await supabase
      .from("wellfare")
      .select("*")
      .order("created_at", { ascending: false });

    const latestMap = new Map<string, any>();

    (data || []).forEach((r) => {
      const existing = latestMap.get(r.member_id);
      if (
        !existing ||
        new Date(r.created_at) > new Date(existing.created_at)
      ) {
        latestMap.set(r.member_id, r);
      }
    });

    const enriched = Array.from(latestMap.values()).map((r) => {
      const m = members.find((x) => x.id === r.member_id);
      return {
        ...r,
        name: m?.user_name || "Unknown",
        member_no: m?.member_no || "",
      };
    });

    setTotalActivePages(Math.ceil(enriched.length / PAGE_SIZE));

    setActiveMembers(
      enriched.slice(
        (pageActive - 1) * PAGE_SIZE,
        pageActive * PAGE_SIZE
      )
    );
  };

  /* --------------------------------------------------
     RECENT CONTRIBUTIONS TAB
  -------------------------------------------------- */
  const fetchContributions = async () => {
    let query = supabase
      .from("wellfare")
      .select("*", { count: "exact" })
      .order("created_at", { ascending: false });

    if (filterDate) {
      query = query.eq("deposit_date", filterDate);
    }

    const { data, count } = await query;

    let filtered = data || [];

    if (filterMemberNo) {
      const member = members.find(
        (m) => m.member_no === filterMemberNo
      );
      if (member) {
        filtered = filtered.filter(
          (r) => r.member_id === member.id
        );
      }
    }

    const enriched = filtered.map((r) => {
      const m = members.find((x) => x.id === r.member_id);
      return {
        ...r,
        name: m?.user_name || "Unknown",
      };
    });

    setTotalContribPages(
      Math.ceil((count || 0) / PAGE_SIZE)
    );

    setContributions(
      enriched.slice(
        (pageContrib - 1) * PAGE_SIZE,
        pageContrib * PAGE_SIZE
      )
    );
  };

  /* -------------------------------------------------- */
  useEffect(() => {
    fetchMembers();
  }, []);

  useEffect(() => {
    if (members.length) {
      fetchActiveMembers();
      fetchContributions();
      computeSummaryTotal();
    }
  }, [members, pageActive, pageContrib, filterDate, filterMemberNo]);

  /* -------------------------------------------------- */
  return (
    <div className="space-y-6">

      {/* SUMMARY CARD */}
      <Card>
        <CardHeader>
          <CardTitle>Total Welfare</CardTitle>
        </CardHeader>
        <CardContent>
          <p className="text-3xl font-bold">
            KSh {summaryTotal.toLocaleString()}
          </p>
        </CardContent>
      </Card>

      <div className="flex justify-between items-center">
        <div>
          <h2 className="text-3xl font-bold">Welfare Management</h2>
          <p className="text-muted-foreground">
            Manage welfare registration and contributions
          </p>
        </div>

        <Button onClick={() => setShowSub(!showSub)}>
          {showSub ? "Close" : "Welfare Subscription"}
        </Button>
      </div>

      {showSub && (
        <Card>
          <CardHeader>
            <CardTitle>Update Welfare Registration</CardTitle>
          </CardHeader>
          <CardContent className="space-y-4">
            <Input
              placeholder="Member Number"
              value={memberNo}
              onChange={(e) => setMemberNo(e.target.value)}
            />

            <select
              className="border rounded px-3 py-2 w-full"
              value={regStatus}
              onChange={(e) => setRegStatus(e.target.value)}
            >
              <option value="Active">Activate</option>
              <option value="Inactive">Deactivate</option>
            </select>

            <Button onClick={updateRegStatus}>
              Update Status
            </Button>
          </CardContent>
        </Card>
      )}

      {/* ---- REST OF YOUR TABS REMAIN UNCHANGED ---- */}
      <Tabs value={tab} onValueChange={setTab}>
        <TabsList className="grid w-full grid-cols-2">
          <TabsTrigger value="active">
            Active Members
          </TabsTrigger>
          <TabsTrigger value="recent">
            Recent Contributions
          </TabsTrigger>
        </TabsList>

        <TabsContent value="active">
          <Card className="mt-4">
            <CardContent className="space-y-4">
              {activeMembers.map((m) => (
                <div key={m.id} className="flex justify-between border-b pb-2">
                  <div>
                    <p className="font-medium">{m.name}</p>
                    <p className="text-sm">{m.member_no}</p>
                  </div>
                  <div className="text-right">
                    <Badge>{m.reg_status || "Inactive"}</Badge>
                    <p className="text-sm">
                      Reg Fee: KSh {Number(m.reg_fee || 0).toFixed(2)}
                    </p>
                    <p className="text-sm">
                      Total Welfare: KSh {Number(m.total_wellfare || 0).toFixed(2)}
                    </p>
                  </div>
                </div>
              ))}

              <div className="flex justify-between mt-4">
                <Button
                  disabled={pageActive === 1}
                  onClick={() => setPageActive((p) => p - 1)}
                >
                  Previous
                </Button>
                <span>Page {pageActive}</span>
                <Button
                  disabled={pageActive === totalActivePages}
                  onClick={() => setPageActive((p) => p + 1)}
                >
                  Next
                </Button>
              </div>
            </CardContent>
          </Card>
        </TabsContent>

        <TabsContent value="recent">
          <Card className="mt-4">
            <CardContent className="space-y-4">
              <div className="flex gap-3">
                <Input
                  type="date"
                  value={filterDate}
                  onChange={(e) => setFilterDate(e.target.value)}
                />
                <Input
                  placeholder="Filter by Member No"
                  value={filterMemberNo}
                  onChange={(e) =>
                    setFilterMemberNo(e.target.value)
                  }
                />
              </div>

              {contributions.map((c) => (
                <div key={c.id} className="flex justify-between border-b pb-2">
                  <div>
                    <p className="font-medium">{c.name}</p>
                    <p className="text-sm">Deposited: {c.deposit_date}</p>
                  </div>
                  <div className="text-right">
                    <p>KSh {Number(c.amount).toFixed(2)}</p>
                    <p className="text-sm">
                      Total Welfare: KSh {Number(c.total_wellfare || 0).toFixed(2)}
                    </p>
                    <Badge>{c.status}</Badge>
                  </div>
                </div>
              ))}

              <div className="flex justify-between mt-4">
                <Button
                  disabled={pageContrib === 1}
                  onClick={() => setPageContrib((p) => p - 1)}
                >
                  Previous
                </Button>
                <span>Page {pageContrib}</span>
                <Button
                  disabled={pageContrib === totalContribPages}
                  onClick={() => setPageContrib((p) => p + 1)}
                >
                  Next
                </Button>
              </div>
            </CardContent>
          </Card>
        </TabsContent>
      </Tabs>
    </div>
  );
};

export default AdminWelfare;