"use client";

import { useEffect, useState } from "react";
import { supabase } from "@/lib/supabase";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Badge } from "@/components/ui/badge";
import { Input } from "@/components/ui/input";
import { AlertCircle, CheckCircle2 } from "lucide-react";

const DAILY_TARGET = 100;

const DailyDepositSection = () => {
  const [loading, setLoading] = useState(true);
  const [memberId, setMemberId] = useState<string | null>(null);

  const [weeklyTotal, setWeeklyTotal] = useState(0);
  const [totalFines, setTotalFines] = useState(0);
  const [streak, setStreak] = useState(0);
  const [recentDeposits, setRecentDeposits] = useState<any[]>([]);
  const [fineFee, setFineFee] = useState(0);

  const [filterDate, setFilterDate] = useState("");

  /* ---------------------------------------------
      Format Date -> YYYY-MM-DD
  --------------------------------------------- */
  const formatDate = (d: Date) => d.toISOString().split("T")[0];

  /* ---------------------------------------------
      Get Logged in User
  --------------------------------------------- */
  const getUser = async () => {
    const { data } = await supabase.auth.getUser();
    return data?.user?.id ?? null;
  };

  /* ---------------------------------------------
      ✅ FETCH FINE FEE FROM SETTINGS (LATEST)
      This is what users SEE they will be charged
  --------------------------------------------- */
 const fetchFineFeeFromSettings = async () => {
  const today = new Date().toISOString().split("T")[0]; // YYYY-MM-DD

  const { data, error } = await supabase
    .from("settings")
    .select("fine_fee")
    .lte("effective_date", today)                 // only effective settings
    .order("effective_date", { ascending: false }) // most recent date first
    .order("created_at", { ascending: false })     // newest record wins
    .limit(1)
    .single();

  if (error) {
    console.error("Failed to fetch fine fee from settings:", error);
    return;
  }

  setFineFee(Number(data?.fine_fee ?? 0));
};


  /* ---------------------------------------------
      ✅ FETCH TOTAL FINES FROM DEDUCTIONS
      (Accounting source of truth)
  --------------------------------------------- */
  const fetchTotalFines = async (uid: string, date?: string) => {
    let query = supabase
      .from("deductions")
      .select("fine_fee")
      .eq("member_id", uid);

    if (date) {
      query = query.eq("date", date);
    }

    const { data, error } = await query;

    if (error) {
      console.error("Failed to fetch fines:", error);
      return;
    }

    const total =
      data?.reduce((sum, row) => sum + Number(row.fine_fee ?? 0), 0) ?? 0;

    setTotalFines(total);
  };

  /* ---------------------------------------------
      SMART STREAK LOGIC
  --------------------------------------------- */
  const calculateStreak = (records: any[]) => {
    if (!records.length) return 0;

    let streakCount = 0;
    let lastDate = new Date();

    for (const record of records) {
      const recordDate = new Date(record.deposit_date);

      const diff =
        (lastDate.setHours(0, 0, 0, 0) -
          recordDate.setHours(0, 0, 0, 0)) /
        (1000 * 60 * 60 * 24);

      if (diff !== 0 && diff !== 1) break;
      if (record.status !== "paid on time") break;

      streakCount++;
      lastDate = new Date(record.deposit_date);
    }

    return streakCount;
  };

  /* ---------------------------------------------
      Fetch Weekly Summary
  --------------------------------------------- */
  const fetchWeeklySummary = async (uid: string) => {
    const sevenDaysAgo = formatDate(
      new Date(Date.now() - 7 * 24 * 60 * 60 * 1000)
    );

    const { data } = await supabase
      .from("dailydeposits")
      .select("*")
      .eq("member_id", uid)
      .gte("deposit_date", sevenDaysAgo)
      .order("deposit_date", { ascending: false });

    if (!data) return;

    setRecentDeposits(data);

    const total = data.reduce((sum, r) => sum + Number(r.amount), 0);
    setWeeklyTotal(total);

    setStreak(calculateStreak(data));
  };

  /* ---------------------------------------------
      Fetch Single Day Filter
  --------------------------------------------- */
  const fetchFilteredDay = async (uid: string, date: string) => {
    const { data } = await supabase
      .from("dailydeposits")
      .select("*")
      .eq("member_id", uid)
      .eq("deposit_date", date)
      .order("deposit_date", { ascending: false });

    setRecentDeposits(data ?? []);

    const sum = data?.reduce((s, r) => s + Number(r.amount), 0) ?? 0;
    setWeeklyTotal(sum);

    setStreak(data && data[0]?.status === "paid on time" ? 1 : 0);
  };

  /* ---------------------------------------------
      Initial Load
  --------------------------------------------- */
  useEffect(() => {
    (async () => {
      const uid = await getUser();
      if (!uid) return;

      setMemberId(uid);

      await fetchFineFeeFromSettings();
      await fetchWeeklySummary(uid);
      await fetchTotalFines(uid);

      setLoading(false);
    })();
  }, []);

  /* ---------------------------------------------
      Date Filter Change
  --------------------------------------------- */
  useEffect(() => {
    if (!memberId) return;

    if (filterDate === "") {
      fetchWeeklySummary(memberId);
      fetchTotalFines(memberId);
    } else {
      fetchFilteredDay(memberId, filterDate);
      fetchTotalFines(memberId, filterDate);
    }
  }, [filterDate, memberId]);

  if (loading) return <p>Loading...</p>;

  return (
    <div className="space-y-6">
      {/* Header */}
      <div className="flex items-center justify-between">
        <div>
          <h2 className="text-3xl font-bold">Daily Deposits</h2>
          <p className="text-muted-foreground">
            Track your daily savings and fines
          </p>
        </div>

        <Input
          type="date"
          className="w-48"
          value={filterDate}
          onChange={(e) => setFilterDate(e.target.value)}
        />
      </div>

      {/* Summary Cards */}
      <div className="grid gap-4 md:grid-cols-4">
        <Card>
          <CardHeader>
            <CardTitle className="text-sm">Daily Target</CardTitle>
          </CardHeader>
          <CardContent>
            <p className="text-2xl font-bold">KSh {DAILY_TARGET}</p>
          </CardContent>
        </Card>

        <Card>
          <CardHeader>
            <CardTitle className="text-sm">
              {filterDate ? "Total for Day" : "Total This Week"}
            </CardTitle>
          </CardHeader>
          <CardContent>
            <p className="text-2xl font-bold">
              KSh {weeklyTotal.toLocaleString()}
            </p>
          </CardContent>
        </Card>

        <Card>
          <CardHeader>
            <CardTitle className="text-sm">Current Streak</CardTitle>
          </CardHeader>
          <CardContent>
            <p className="text-2xl font-bold">{streak} days</p>
          </CardContent>
        </Card>

        <Card>
          <CardHeader>
            <CardTitle className="text-sm">Total Fines</CardTitle>
          </CardHeader>
          <CardContent>
            <p className="text-2xl font-bold text-destructive">
              KSh {totalFines}
            </p>
            <p className="text-xs text-muted-foreground">
              KSh {fineFee} per late deposit
            </p>
          </CardContent>
        </Card>
      </div>

      {/* Recent Deposits */}
      <Card>
        <CardHeader>
          <CardTitle>
            {filterDate ? `Deposits on ${filterDate}` : "Recent Deposits"}
          </CardTitle>
        </CardHeader>
        <CardContent>
          <div className="space-y-3">
            {recentDeposits.length === 0 && (
              <p className="text-sm text-muted-foreground">
                No deposits found.
              </p>
            )}

            {recentDeposits.map((d: any, i: number) => (
              <div
                key={i}
                className="flex items-center justify-between border-b pb-3 last:border-0"
              >
                <div className="flex items-center gap-3">
                  {d.status === "paid on time" ? (
                    <CheckCircle2 className="h-5 w-5 text-secondary" />
                  ) : (
                    <AlertCircle className="h-5 w-5 text-destructive" />
                  )}

                  <div>
                    <p className="font-medium">{d.deposit_date}</p>
                    <p className="text-sm text-muted-foreground">
                      KSh {d.amount}
                    </p>
                  </div>
                </div>

                <Badge
                  className={
                    d.status === "paid on time"
                      ? "bg-secondary"
                      : "bg-destructive"
                  }
                >
                  {d.status === "paid on time" ? "On Time" : "Late"}
                </Badge>
              </div>
            ))}
          </div>
        </CardContent>
      </Card>
    </div>
  );
};

export default DailyDepositSection;
