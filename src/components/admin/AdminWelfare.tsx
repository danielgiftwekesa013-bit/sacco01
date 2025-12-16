"use client";

import { useEffect, useMemo, useState } from "react";
import { supabase } from "@/lib/supabase";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Badge } from "@/components/ui/badge";
import { Input } from "@/components/ui/input";
import { Button } from "@/components/ui/button";

import {
  Chart as ChartJS,
  CategoryScale,
  LinearScale,
  BarElement,
  LineElement,
  PointElement,
  Tooltip,
  Legend,
} from "chart.js";
import { Chart } from "react-chartjs-2";

ChartJS.register(
  CategoryScale,
  LinearScale,
  BarElement,
  LineElement,
  PointElement,
  Tooltip,
  Legend
);

const AdminWelfare = () => {
  const [records, setRecords] = useState<any[]>([]);
  const [members, setMembers] = useState<any[]>([]);
  const [filtered, setFiltered] = useState<any[]>([]);
  const [loading, setLoading] = useState(false);

  const [selectedMonth, setSelectedMonth] = useState("");
  const [selectedMember, setSelectedMember] = useState("");
  const [search, setSearch] = useState("");

  const [page, setPage] = useState(1);
  const pageSize = 10;

  const [stats, setStats] = useState({
    total: 0,
    current: 0,
    overdue: 0,
  });

  /* ---------------------------------------------
   FETCH MEMBERS
  --------------------------------------------- */
  const fetchMembers = async () => {
    const { data } = await supabase
      .from("userprofiles")
      .select("id, user_name, phone");

    setMembers(data || []);
  };

  /* ---------------------------------------------
   FETCH WELFARE RECORDS
  --------------------------------------------- */
  const fetchWelfare = async () => {
    setLoading(true);

    let query = supabase
      .from("wellfare")
      .select("*")
      .order("created_at", { ascending: false });

    if (selectedMonth) {
      const [year, month] = selectedMonth.split("-");
      query = query
        .gte("deposit_date", `${year}-${month}-01`)
        .lte("deposit_date", `${year}-${month}-31`);
    }

    if (selectedMember) {
      query = query.eq("member_id", selectedMember);
    }

    const { data, error } = await query;

    if (error) {
      console.error(error);
      setLoading(false);
      return;
    }

    const enriched = (data || []).map((r) => {
      const m = members.find((x) => x.id === r.member_id);
      return {
        ...r,
        user_name: m?.user_name || "Unknown",
        phone: m?.phone || "",
      };
    });

    setRecords(enriched);
    setFiltered(enriched);

    computeStats(enriched);
    setLoading(false);
  };

  /* ---------------------------------------------
   STATISTICS
  --------------------------------------------- */
  const computeStats = (data: any[]) => {
    /**
     * TOTAL CONTRIBUTIONS
     * Use MOST RECENT total_wellfare per member
     * based on created_at timestamp
     */
    const latestPerMember = new Map<string, any>();

    data.forEach((r) => {
      const existing = latestPerMember.get(r.member_id);
      if (
        !existing ||
        new Date(r.created_at) > new Date(existing.created_at)
      ) {
        latestPerMember.set(r.member_id, r);
      }
    });

    const total = Array.from(latestPerMember.values()).reduce(
      (sum, r) => sum + Number(r.total_wellfare || 0),
      0
    );

    /**
     * CURRENT
     * Members who have paid in selected month
     */
    const paidMembers = new Set(data.map((r) => r.member_id));

    /**
     * OVERDUE
     * Members with NO welfare record for the month
     */
    const overdue =
      members.length - paidMembers.size >= 0
        ? members.length - paidMembers.size
        : 0;

    setStats({
      total,
      current: paidMembers.size,
      overdue,
    });
  };

  /* ---------------------------------------------
   SEARCH
  --------------------------------------------- */
  useEffect(() => {
    const t = search.toLowerCase();
    setFiltered(
      records.filter(
        (r) =>
          r.user_name.toLowerCase().includes(t) ||
          r.phone.toLowerCase().includes(t)
      )
    );
  }, [search, records]);

  /* ---------------------------------------------
   INITIAL LOAD
  --------------------------------------------- */
  useEffect(() => {
    fetchMembers();
  }, []);

  useEffect(() => {
    if (members.length) fetchWelfare();
  }, [members, selectedMonth, selectedMember]);

  /* ---------------------------------------------
   PAGINATION
  --------------------------------------------- */
  const paginated = filtered.slice(
    (page - 1) * pageSize,
    page * pageSize
  );

  /* ---------------------------------------------
   MONTHLY BAR + TRENDLINE CHART
  --------------------------------------------- */
  const chartData = useMemo(() => {
    const totals: Record<string, number> = {};

    records.forEach((r) => {
      const key = r.deposit_date.slice(0, 7);
      totals[key] = (totals[key] || 0) + Number(r.amount);
    });

    const labels = Object.keys(totals).sort();

    return {
      labels,
      datasets: [
        {
          type: "bar" as const,
          label: "Monthly Contributions",
          data: labels.map((l) => totals[l]),
        },
        {
          type: "line" as const,
          label: "Trend",
          data: labels.map((l) => totals[l]),
          tension: 0.3,
        },
      ],
    };
  }, [records]);

  /* ---------------------------------------------
   RENDER
  --------------------------------------------- */
  return (
    <div className="space-y-8">
      {/* HEADER */}
      <div className="flex justify-between flex-wrap gap-3">
        <div>
          <h2 className="text-3xl font-bold">Welfare Management</h2>
          <p className="text-muted-foreground">
            Track welfare contributions
          </p>
        </div>

        <div className="flex gap-3 flex-wrap">
          <Input
            type="month"
            value={selectedMonth}
            onChange={(e) => setSelectedMonth(e.target.value)}
            className="w-40"
          />

          <select
            className="border rounded px-3 py-2"
            value={selectedMember}
            onChange={(e) => setSelectedMember(e.target.value)}
          >
            <option value="">All Members</option>
            {members.map((m) => (
              <option key={m.id} value={m.id}>
                {m.user_name}
              </option>
            ))}
          </select>

          <Input
            placeholder="Search member..."
            value={search}
            onChange={(e) => setSearch(e.target.value)}
            className="w-48"
          />

          <Button variant="outline" onClick={() => setSelectedMonth("")}>
            Clear
          </Button>
        </div>
      </div>

      {/* STATS */}
      <div className="grid gap-4 md:grid-cols-3">
        <Card>
          <CardHeader>
            <CardTitle>Total Contributions</CardTitle>
          </CardHeader>
          <CardContent>
            <p className="text-2xl font-bold">
              KSh {stats.total.toLocaleString()}
            </p>
          </CardContent>
        </Card>

        <Card>
          <CardHeader>
            <CardTitle>Current</CardTitle>
          </CardHeader>
          <CardContent>
            <p className="text-2xl font-bold">{stats.current}</p>
          </CardContent>
        </Card>

        <Card>
          <CardHeader>
            <CardTitle>Overdue</CardTitle>
          </CardHeader>
          <CardContent>
            <p className="text-2xl font-bold text-destructive">
              {stats.overdue}
            </p>
          </CardContent>
        </Card>
      </div>

      {/* CHART */}
      <Card>
        <CardHeader>
          <CardTitle>Monthly Welfare Contributions</CardTitle>
        </CardHeader>
        <CardContent>
          <Chart data={chartData} />
        </CardContent>
      </Card>

      {/* TABLE */}
      <Card>
        <CardHeader>
          <CardTitle>Recent Welfare Contributions</CardTitle>
        </CardHeader>

        <CardContent>
          {loading ? (
            <p className="text-center py-6">Loading...</p>
          ) : paginated.length === 0 ? (
            <p className="text-center py-6">No records found</p>
          ) : (
            <div className="space-y-4">
              {paginated.map((r) => (
                <div
                  key={r.id}
                  className="flex justify-between border-b pb-3"
                >
                  <div>
                    <p className="font-medium">{r.user_name}</p>
                    <p className="text-sm text-muted-foreground">
                      Paid: {r.deposit_date}
                    </p>
                  </div>

                  <div className="flex gap-4 items-center">
                    <p className="font-semibold">
                      KSh {Number(r.amount).toLocaleString()}
                    </p>
                    <Badge>{r.status}</Badge>
                  </div>
                </div>
              ))}
            </div>
          )}

          {/* PAGINATION */}
          <div className="flex justify-between items-center mt-4">
            <Button
              disabled={page === 1}
              onClick={() => setPage((p) => p - 1)}
            >
              Previous
            </Button>
            <span>Page {page}</span>
            <Button
              disabled={filtered.length <= page * pageSize}
              onClick={() => setPage((p) => p + 1)}
            >
              Next
            </Button>
          </div>

          <div className="pt-6">
            <Button variant="outline" onClick={fetchWelfare}>
              Refresh
            </Button>
          </div>
        </CardContent>
      </Card>
    </div>
  );
};

export default AdminWelfare;
