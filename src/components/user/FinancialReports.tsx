"use client";

import { useEffect, useState } from "react";
import { supabase } from "@/lib/supabase";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Select, SelectItem } from "@/components/ui/select";
import { Input } from "@/components/ui/input";

type ReportType = "savings" | "loans" | "shares" | "all";

const FinancialReportsPage = () => {
  const [memberId, setMemberId] = useState<string | null>(null);
  const [memberName, setMemberName] = useState("");
  const [reportType, setReportType] = useState<ReportType>("savings");

  const [fromDate, setFromDate] = useState("");
  const [toDate, setToDate] = useState("");

  const [savings, setSavings] = useState<any[]>([]);
  const [loans, setLoans] = useState<any[]>([]);
  const [shares, setShares] = useState<any[]>([]);

  const getUser = async () => {
    const { data } = await supabase.auth.getUser();
    const uid = data?.user?.id;

    if (!uid) return;

    setMemberId(uid);

    const { data: profile } = await supabase
      .from("userprofiles")
      .select("user_name")
      .eq("id", uid)
      .single();

    setMemberName(profile?.user_name ?? "");
  };

  useEffect(() => {
    getUser();
  }, []);

  const fetchSavings = async () => {
    if (!memberId) return;

    const { data } = await supabase
      .from("dailydeposits")
      .select("deposit_date, amount, total_deposit")
      .eq("member_id", memberId)
      .gte("deposit_date", fromDate)
      .lte("deposit_date", toDate)
      .order("deposit_date", { ascending: false });

    setSavings(data ?? []);
  };

  const fetchLoans = async () => {
    if (!memberId) return;

    const { data } = await supabase
      .from("loans")
      .select("reason, total_loan, loan_balance, time, due_date, approved_date, status")
      .eq("member_id", memberId)
      .order("approved_date", { ascending: false });

    setLoans(data ?? []);
  };

  const fetchShares = async () => {
    if (!memberId) return;

    const { data } = await supabase
      .from("shares")
      .select("*")
      .eq("member_id", memberId)
      .gte("deposit_date", fromDate)
      .lte("deposit_date", toDate)
      .order("deposit_date", { ascending: false });

    if (!data) return;

    // fetch receiver names
    const enriched = await Promise.all(
      data.map(async (s) => {
        if (!s.receiver) return { ...s, receiver_name: "-" };

        const { data: user } = await supabase
          .from("userprofiles")
          .select("user_name")
          .eq("member_no", s.receiver)
          .single();

        return {
          ...s,
          receiver_name: user?.user_name ?? "-"
        };
      })
    );

    setShares(enriched);
  };

  const generateReport = async () => {
    if (reportType === "savings" || reportType === "all") {
      await fetchSavings();
    }
    if (reportType === "loans" || reportType === "all") {
      await fetchLoans();
    }
    if (reportType === "shares" || reportType === "all") {
      await fetchShares();
    }
  };

  return (
    <div className="space-y-6">

      <div>
        <h2 className="text-3xl font-bold">Financial Statements</h2>
        <p className="text-muted-foreground">
          Preview and download your financial reports
        </p>
      </div>

      {/* FILTER SECTION */}
      <Card>
        <CardContent className="grid gap-4 md:grid-cols-4 p-6">
          
          <select
            className="border p-2 rounded-md"
            value={reportType}
            onChange={(e) => setReportType(e.target.value as ReportType)}
          >
            <option value="savings">Savings</option>
            <option value="loans">Loans</option>
            <option value="shares">Shares</option>
            <option value="all">All</option>
          </select>

          <Input type="date" value={fromDate} onChange={(e) => setFromDate(e.target.value)} />
          <Input type="date" value={toDate} onChange={(e) => setToDate(e.target.value)} />

          <Button onClick={generateReport}>
            Generate Report
          </Button>

        </CardContent>
      </Card>

      {/* SAVINGS TABLE */}
      {(reportType === "savings" || reportType === "all") && savings.length > 0 && (
        <Card>
          <CardHeader>
            <CardTitle>Savings Statement</CardTitle>
          </CardHeader>
          <CardContent>
            <div className="overflow-auto">
              <table className="w-full text-sm">
                <thead>
                  <tr>
                    <th>Name</th>
                    <th>Date</th>
                    <th>Amount</th>
                    <th>Total</th>
                  </tr>
                </thead>
                <tbody>
                  {savings.map((s, i) => (
                    <tr key={i}>
                      <td>{memberName}</td>
                      <td>{s.deposit_date}</td>
                      <td>KSh {s.amount}</td>
                      <td>KSh {s.total_deposit}</td>
                    </tr>
                  ))}
                </tbody>
              </table>
            </div>
          </CardContent>
        </Card>
      )}

      {/* LOANS TABLE */}
      {(reportType === "loans" || reportType === "all") && loans.length > 0 && (
        <Card>
          <CardHeader>
            <CardTitle>Loans Statement</CardTitle>
          </CardHeader>
          <CardContent>
            <div className="overflow-auto">
              <table className="w-full text-sm">
                <thead>
                  <tr>
                    <th>Name</th>
                    <th>Loan Purpose</th>
                    <th>Total Loan</th>
                    <th>Balance</th>
                    <th>Repayment Period</th>
                    <th>Due Date</th>
                    <th>Approved Date</th>
                    <th>Status</th>
                  </tr>
                </thead>
                <tbody>
                  {loans.map((l, i) => (
                    <tr key={i}>
                      <td>{memberName}</td>
                      <td>{l.reason}</td>
                      <td>KSh {l.total_loan}</td>
                      <td>KSh {l.loan_balance}</td>
                      <td>{l.time} months</td>
                      <td>{l.due_date}</td>
                      <td>{l.approved_date}</td>
                      <td>{l.status}</td>
                    </tr>
                  ))}
                </tbody>
              </table>
            </div>
          </CardContent>
        </Card>
      )}

      {/* SHARES TABLE */}
      {(reportType === "shares" || reportType === "all") && shares.length > 0 && (
        <Card>
          <CardHeader>
            <CardTitle>Shares Statement</CardTitle>
          </CardHeader>
          <CardContent>
            <div className="overflow-auto">
              <table className="w-full text-sm">
                <thead>
                  <tr>
                    <th>Name</th>
                    <th>Deposit Date</th>
                    <th>Share Amount</th>
                    <th>Total Shares</th>
                    <th>Transfer Date</th>
                    <th>Receiver</th>
                    <th>Transfer Amount</th>
                  </tr>
                </thead>
                <tbody>
                  {shares.map((s, i) => (
                    <tr key={i}>
                      <td>{memberName}</td>
                      <td>{s.deposit_date}</td>
                      <td>KSh {s.amount}</td>
                      <td>KSh {s.total_shares}</td>
                      <td>{s.transfer_date ?? "-"}</td>
                      <td>{s.receiver_name}</td>
                      <td>{s.transfer_amount ?? "-"}</td>
                    </tr>
                  ))}
                </tbody>
              </table>
            </div>
          </CardContent>
        </Card>
      )}

      {/* FOOTER */}
      <div className="text-center text-xs text-muted-foreground pt-10 border-t">
        <p>All rights reserved by Transpiaggio Sacco</p>
        <p>Generated on {new Date().toLocaleString()}</p>
      </div>

    </div>
  );
};

export default FinancialReportsPage;