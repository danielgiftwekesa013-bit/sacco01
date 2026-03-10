"use client";

import { useEffect, useState } from "react";
import { supabase } from "@/lib/supabase";
import jsPDF from "jspdf";
import autoTable from "jspdf-autotable";

import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
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

  /* ================= GET USER ================= */
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

  /* ================= FETCH SAVINGS ================= */
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

  /* ================= FETCH LOANS ================= */
  const fetchLoans = async () => {
    if (!memberId) return;

    const { data } = await supabase
      .from("loans")
      .select("reason,total_loan,loan_balance,time,due_date,approved_date,status")
      .eq("member_id", memberId)
      .order("approved_date", { ascending: false });

    setLoans(data ?? []);
  };

  /* ================= FETCH SHARES ================= */
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

  /* ================= GENERATE REPORT ================= */
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

  /* ================= DOWNLOAD PDF ================= */
  const downloadPDF = () => {

    const doc = new jsPDF();

    doc.setFontSize(16);
    doc.text("Transpiaggio SACCO Financial Statement", 14, 15);

    doc.setFontSize(10);
    doc.text(`Member: ${memberName}`, 14, 22);
    doc.text(`Generated: ${new Date().toLocaleString()}`, 14, 28);

    let startY = 35;

    /* SAVINGS PDF */
    if (savings.length > 0) {

      doc.text("Savings Statement", 14, startY);

      autoTable(doc,{
        startY: startY + 5,
        head:[["Name","Date","Amount","Total"]],
        body:savings.map((s)=>[
          memberName,
          s.deposit_date,
          `KSh ${s.amount}`,
          `KSh ${s.total_deposit}`
        ]),
        theme:"grid"
      });

      startY = (doc as any).lastAutoTable.finalY + 10;
    }

    /* LOANS PDF */
    if (loans.length > 0) {

      doc.text("Loans Statement",14,startY);

      autoTable(doc,{
        startY:startY + 5,
        head:[["Name","Loan","Total","Balance","Time","Due","Approved","Status"]],
        body:loans.map((l)=>[
          memberName,
          l.reason,
          `KSh ${l.total_loan}`,
          `KSh ${l.loan_balance}`,
          `${l.time} months`,
          l.due_date,
          l.approved_date,
          l.status
        ]),
        theme:"grid"
      });

      startY = (doc as any).lastAutoTable.finalY + 10;
    }

    /* SHARES PDF */
    if (shares.length > 0) {

      doc.text("Shares Statement",14,startY);

      autoTable(doc,{
        startY:startY + 5,
        head:[["Name","Deposit","Amount","Total","Transfer Date","Receiver","Transferred"]],
        body:shares.map((s)=>[
          memberName,
          s.deposit_date,
          `KSh ${s.amount}`,
          `KSh ${s.total_shares}`,
          s.transfer_date ?? "-",
          s.receiver_name,
          s.transfer_amount ?? "-"
        ]),
        theme:"grid"
      });

    }

    doc.save("financial-statement.pdf");
  };

  return (

    <div className="space-y-6 p-4 max-w-full">

      <div>
        <h2 className="text-2xl md:text-3xl font-bold">
          Financial Statements
        </h2>
        <p className="text-muted-foreground text-sm">
          Preview and download your financial reports
        </p>
      </div>

      {/* FILTERS */}

      <Card>

        <CardContent className="grid gap-4 md:grid-cols-4 p-6">

          <select
            className="border rounded-md p-2 w-full"
            value={reportType}
            onChange={(e)=>setReportType(e.target.value as ReportType)}
          >
            <option value="savings">Savings</option>
            <option value="loans">Loans</option>
            <option value="shares">Shares</option>
            <option value="all">All</option>
          </select>

          <Input
            type="date"
            value={fromDate}
            onChange={(e)=>setFromDate(e.target.value)}
          />

          <Input
            type="date"
            value={toDate}
            onChange={(e)=>setToDate(e.target.value)}
          />

          <div className="flex gap-2 flex-wrap">

            <Button onClick={generateReport}>
              Generate
            </Button>

            <Button
              variant="secondary"
              onClick={downloadPDF}
            >
              Download PDF
            </Button>

          </div>

        </CardContent>

      </Card>

      {/* SAVINGS TABLE */}

      {(reportType === "savings" || reportType === "all") && savings.length > 0 && (

        <Card className="border">

          <CardHeader>
            <CardTitle>Savings Statement</CardTitle>
          </CardHeader>

          <CardContent className="overflow-x-auto">

            <table className="w-full text-sm border">

              <thead className="bg-muted">

                <tr>

                  <th className="border p-2">Name</th>
                  <th className="border p-2">Date</th>
                  <th className="border p-2">Amount</th>
                  <th className="border p-2">Total</th>

                </tr>

              </thead>

              <tbody>

                {savings.map((s,i)=>(

                  <tr key={i} className="border">

                    <td className="border p-2">{memberName}</td>
                    <td className="border p-2">{s.deposit_date}</td>
                    <td className="border p-2">KSh {s.amount}</td>
                    <td className="border p-2">KSh {s.total_deposit}</td>

                  </tr>

                ))}

              </tbody>

            </table>

          </CardContent>

        </Card>

      )}

      {/* LOANS */}

      {(reportType === "loans" || reportType === "all") && loans.length > 0 && (

        <Card className="border">

          <CardHeader>
            <CardTitle>Loans Statement</CardTitle>
          </CardHeader>

          <CardContent className="overflow-x-auto">

            <table className="w-full text-sm border">

              <thead className="bg-muted">

                <tr>

                  <th className="border p-2">Name</th>
                  <th className="border p-2">Loan</th>
                  <th className="border p-2">Total</th>
                  <th className="border p-2">Balance</th>
                  <th className="border p-2">Time</th>
                  <th className="border p-2">Due</th>
                  <th className="border p-2">Approved</th>
                  <th className="border p-2">Status</th>

                </tr>

              </thead>

              <tbody>

                {loans.map((l,i)=>(

                  <tr key={i} className="border">

                    <td className="border p-2">{memberName}</td>
                    <td className="border p-2">{l.reason}</td>
                    <td className="border p-2">KSh {l.total_loan}</td>
                    <td className="border p-2">KSh {l.loan_balance}</td>
                    <td className="border p-2">{l.time} months</td>
                    <td className="border p-2">{l.due_date}</td>
                    <td className="border p-2">{l.approved_date}</td>
                    <td className="border p-2">{l.status}</td>

                  </tr>

                ))}

              </tbody>

            </table>

          </CardContent>

        </Card>

      )}

      {/* SHARES */}

      {(reportType === "shares" || reportType === "all") && shares.length > 0 && (

        <Card className="border">

          <CardHeader>
            <CardTitle>Shares Statement</CardTitle>
          </CardHeader>

          <CardContent className="overflow-x-auto">

            <table className="w-full text-sm border">

              <thead className="bg-muted">

                <tr>

                  <th className="border p-2">Name</th>
                  <th className="border p-2">Deposit</th>
                  <th className="border p-2">Amount</th>
                  <th className="border p-2">Total</th>
                  <th className="border p-2">Transfer Date</th>
                  <th className="border p-2">Receiver</th>
                  <th className="border p-2">Transferred</th>

                </tr>

              </thead>

              <tbody>

                {shares.map((s,i)=>(

                  <tr key={i} className="border">

                    <td className="border p-2">{memberName}</td>
                    <td className="border p-2">{s.deposit_date}</td>
                    <td className="border p-2">KSh {s.amount}</td>
                    <td className="border p-2">KSh {s.total_shares}</td>
                    <td className="border p-2">{s.transfer_date ?? "-"}</td>
                    <td className="border p-2">{s.receiver_name}</td>
                    <td className="border p-2">{s.transfer_amount ?? "-"}</td>

                  </tr>

                ))}

              </tbody>

            </table>

          </CardContent>

        </Card>

      )}

      <div className="text-center text-xs text-muted-foreground pt-6 border-t">

        <p>All rights reserved by Transpiaggio Sacco</p>
        <p>Generated on {new Date().toLocaleString()}</p>

      </div>

    </div>
  );
};

export default FinancialReportsPage;