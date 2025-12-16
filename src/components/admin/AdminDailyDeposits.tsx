import { useState, useEffect } from "react";
import { supabase } from "@/lib/supabase";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Badge } from "@/components/ui/badge";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";

const PAGE_SIZE = 10;

const AdminDailyDeposits = () => {
  const [deposits, setDeposits] = useState<any[]>([]);
  const [page, setPage] = useState(1);
  const [totalPages, setTotalPages] = useState(1);
  const [startDate, setStartDate] = useState(new Date().toISOString().slice(0, 10));
  const [endDate, setEndDate] = useState(new Date().toISOString().slice(0, 10));
  const [loading, setLoading] = useState(false);

  // Fetch deposits using member_id to avoid ambiguity
  const fetchDeposits = async () => {
    setLoading(true);

    // First, fetch deposits with count
    const { data: depositsData, count, error } = await supabase
      .from("dailydeposits")
      .select("id, member_id, amount, deposit_date, status", { count: "exact" })
      .gte("deposit_date", startDate)
      .lte("deposit_date", endDate)
      .order("deposit_date", { ascending: false })
      .range((page - 1) * PAGE_SIZE, page * PAGE_SIZE - 1);

    if (error) {
      console.error(error);
      setLoading(false);
      return;
    }

    const memberIds = depositsData.map((d) => d.member_id);

    // Fetch member names separately
    const { data: membersData } = await supabase
      .from("userprofiles")
      .select("id, user_name")
      .in("id", memberIds);

    // Map deposits to include member name
    const formatted = depositsData.map((d) => {
      const member = membersData.find((m) => m.id === d.member_id);
      return {
        id: d.id,
        member: member?.user_name || "Unknown",
        amount: d.amount,
        date: d.deposit_date,
        status: d.status === "paid on time" ? "on-time" : "late",
        fine: d.status === "paid late" ? 10 : 0,
      };
    });

    setDeposits(formatted);
    setTotalPages(Math.ceil((count || 0) / PAGE_SIZE));
    setLoading(false);
  };

  useEffect(() => {
    fetchDeposits();
  }, [page, startDate, endDate]);

  const totalToday = deposits
    .filter((d) => d.date === startDate)
    .reduce((sum, d) => sum + d.amount, 0);

  const onFilter = () => setPage(1) && fetchDeposits();

  return (
    <div className="space-y-6">
      <div>
        <h2 className="text-3xl font-bold">Daily Deposits</h2>
        <p className="text-muted-foreground">Track all user daily deposits</p>
      </div>

      {/* Summary Cards */}
      <div className="grid gap-4 md:grid-cols-3">
        <Card>
          <CardHeader>
            <CardTitle className="text-sm">Today's Deposits</CardTitle>
          </CardHeader>
          <CardContent>
            <p className="text-2xl font-bold">KSh {totalToday.toLocaleString()}</p>
          </CardContent>
        </Card>

        <Card>
          <CardHeader>
            <CardTitle className="text-sm">On-Time Deposits</CardTitle>
          </CardHeader>
          <CardContent>
            <p className="text-2xl font-bold">
              {deposits.filter((d) => d.status === "on-time").length}
            </p>
          </CardContent>
        </Card>

        <Card>
          <CardHeader>
            <CardTitle className="text-sm">Late Deposits</CardTitle>
          </CardHeader>
          <CardContent>
            <p className="text-2xl font-bold text-destructive">
              {deposits.filter((d) => d.status === "late").length}
            </p>
          </CardContent>
        </Card>
      </div>

      {/* Filters */}
      <div className="flex gap-3 flex-wrap">
        <Input type="date" value={startDate} onChange={(e) => setStartDate(e.target.value)} />
        <Input type="date" value={endDate} onChange={(e) => setEndDate(e.target.value)} />
        <Button onClick={onFilter}>Filter</Button>
      </div>

      {/* Deposit List */}
      <Card>
        <CardHeader>
          <CardTitle>Recent Deposits</CardTitle>
        </CardHeader>
        <CardContent>
          {loading ? (
            <p>Loading...</p>
          ) : deposits.length === 0 ? (
            <p>No deposits found.</p>
          ) : (
            <div className="space-y-4">
              {deposits.map((deposit) => (
                <div
                  key={deposit.id}
                  className="flex items-center justify-between border-b pb-3 last:border-0"
                >
                  <div>
                    <p className="font-medium">{deposit.member}</p>
                    <p className="text-sm text-muted-foreground">{deposit.date}</p>
                    {deposit.fine > 0 && (
                      <p className="text-xs text-destructive">Fine: KSh {deposit.fine}</p>
                    )}
                  </div>
                  <div className="flex items-center gap-3">
                    <p className="font-semibold">KSh {deposit.amount}</p>
                    <Badge
                      className={deposit.status === "on-time" ? "bg-secondary" : "bg-destructive"}
                    >
                      {deposit.status === "on-time" ? "On Time" : "Late"}
                    </Badge>
                  </div>
                </div>
              ))}
            </div>
          )}
        </CardContent>
      </Card>

      {/* Pagination */}
      <div className="flex justify-center gap-2 mt-4">
        <Button disabled={page <= 1} onClick={() => setPage((p) => p - 1)}>
          Prev
        </Button>
        <span className="px-3 py-1 border rounded">
          {page} / {totalPages}
        </span>
        <Button disabled={page >= totalPages} onClick={() => setPage((p) => p + 1)}>
          Next
        </Button>
      </div>
    </div>
  );
};

export default AdminDailyDeposits;
