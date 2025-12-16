import { useEffect, useMemo, useState } from "react";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import {
  Table,
  TableBody,
  TableCell,
  TableHead,
  TableHeader,
  TableRow,
} from "@/components/ui/table";
import { Input } from "@/components/ui/input";
import { Button } from "@/components/ui/button";
import { supabase } from "@/lib/supabase";
import { jsPDF } from "jspdf";
import autoTable from "jspdf-autotable";

/* ---------------- HELPERS ---------------- */

const toDateKey = (d: Date) => d.toISOString().slice(0, 10);
const pad = (n: number) => (n < 10 ? `0${n}` : `${n}`);

export default function AdminCashAnalysis() {
  /* ---------------- STATE ---------------- */

  const [viewMode, setViewMode] = useState<"daily" | "monthly" | "yearly">(
    "daily"
  );

  const now = new Date();
  const todayKey = toDateKey(now);
  const defaultMonth = `${now.getFullYear()}-${pad(now.getMonth() + 1)}`;

  const [selectedDate, setSelectedDate] = useState(todayKey);
  const [selectedMonth, setSelectedMonth] = useState(defaultMonth);
  const [selectedYear, setSelectedYear] = useState(now.getFullYear());

  const [transactions, setTransactions] = useState<any[]>([]);
  const [loading, setLoading] = useState(false);

  const [page, setPage] = useState(1);
  const ROWS_PER_PAGE = 20;

  /* ---------------- LOAD DATA ---------------- */

  useEffect(() => {
    const load = async () => {
      setLoading(true);

      try {
        const [
          { data: deposits },
          { data: payments },
          { data: welfareRows },
          { data: sharesRows },
          { data: deductions },
          { data: users },
        ] = await Promise.all([
          supabase.from("dailydeposits").select("amount, deposit_date, member_id"),
          supabase
            .from("payments_ledger")
            .select("member_id, payment_for, amount, created_at"),
          supabase.from("wellfare").select("amount, deposit_date, member_id"),
          supabase.from("shares").select("amount, deposit_date, member_id"),
          supabase
            .from("deductions")
            .select("member_id, fine_fee, shaa_fee, transfer_fee, date, created_at"),
          supabase.from("userprofiles").select("id, user_name"),
        ]);

        const memberMap = (users || []).reduce((acc: any, u: any) => {
          acc[u.id] = u.user_name;
          return acc;
        }, {});

        const rowsMap: Record<string, any> = {};

        const ensureRow = (dateStr: string, memberId: string | null) => {
          const key = `${dateStr}|${memberId || "unknown"}`;
          if (!rowsMap[key]) {
            rowsMap[key] = {
              id: key,
              date: dateStr,
              memberId,
              member: memberMap[memberId] || "Unknown",
              dailyDeposit: 0,
              loanRepayment: 0,
              welfare: 0,
              shares: 0,
              membership: 0,
              shaa: 0,
              fines: 0,
              transferFee: 0,
              total: 0,
            };
          }
          return rowsMap[key];
        };

        /* ---- Deposits ---- */
        (deposits || []).forEach((d: any) => {
          const dateStr = d.deposit_date?.toString().slice(0, 10);
          const r = ensureRow(dateStr, d.member_id);
          r.dailyDeposit += Number(d.amount || 0);
        });

        /* ---- Welfare ---- */
        (welfareRows || []).forEach((w: any) => {
          const dateStr = w.deposit_date?.toString().slice(0, 10);
          const r = ensureRow(dateStr, w.member_id);
          r.welfare += Number(w.amount || 0);
        });

        /* ---- Shares ---- */
        (sharesRows || []).forEach((s: any) => {
          const dateStr = s.deposit_date?.toString().slice(0, 10);
          const r = ensureRow(dateStr, s.member_id);
          r.shares += Number(s.amount || 0);
        });

        /* ---- Payments Ledger (NO internal fees here) ---- */
        (payments || []).forEach((p: any) => {
          const dateStr = p.created_at?.toString().slice(0, 10);
          const r = ensureRow(dateStr, p.member_id);
          const amt = Number(p.amount || 0);

          if (p.payment_for === "LoanRepayment") r.loanRepayment += amt;
          if (p.payment_for === "Membership") r.membership += amt;
          if (p.payment_for === "Welfare") r.welfare += amt;
          if (p.payment_for === "Shares") r.shares += amt;
        });

        /* ---- Deductions (ONLY source of SHAA / FINES / TRANSFER FEE) ---- */
        (deductions || []).forEach((d: any) => {
          const dateStr = (d.date || d.created_at).toString().slice(0, 10);
          const r = ensureRow(dateStr, d.member_id);
          r.fines += Number(d.fine_fee || 0);
          r.shaa += Number(d.shaa_fee || 0);
          r.transferFee += Number(d.transfer_fee || 0);
        });

        const rowsArray = Object.values(rowsMap).sort((a: any, b: any) =>
          a.date > b.date ? 1 : -1
        );

        /* ---- Compute TOTAL per member per date ---- */
        rowsArray.forEach((r: any) => {
          r.total =
            r.dailyDeposit +
            r.welfare +
            r.shares +
            r.membership -
            (r.shaa + r.fines + r.transferFee);
        });

        setTransactions(rowsArray);
      } catch (err) {
        console.error(err);
        setTransactions([]);
      } finally {
        setLoading(false);
      }
    };

    load();
  }, []);

  /* ---------------- DISPLAY LOGIC ---------------- */

  const displayRows = useMemo(() => {
    if (!transactions.length) return [];

    if (viewMode === "daily") {
      return transactions
        .filter((t) => t.date === selectedDate)
        .sort((a, b) => (a.member > b.member ? 1 : -1));
    }

    if (viewMode === "monthly") {
      const [y, m] = selectedMonth.split("-");
      const map: Record<string, any> = {};

      transactions.forEach((t) => {
        if (!t.date.startsWith(`${y}-${m}`)) return;

        const key = t.memberId;
        const r =
          map[key] || {
            member: t.member,
            dailyDeposit: 0,
            loanRepayment: 0,
            welfare: 0,
            shares: 0,
            membership: 0,
            shaa: 0,
            fines: 0,
            transferFee: 0,
            total: 0,
          };

        Object.keys(r).forEach((k) => {
          if (k !== "member") r[k] += Number(t[k] || 0);
        });

        map[key] = r;
      });

      return Object.values(map);
    }

    /* ---- YEARLY ---- */
    const map: Record<string, any> = {};
    transactions.forEach((t) => {
      if (!t.date.startsWith(String(selectedYear))) return;

      const key = t.memberId;
      const r =
        map[key] || {
          member: t.member,
          dailyDeposit: 0,
          loanRepayment: 0,
          welfare: 0,
          shares: 0,
          membership: 0,
          shaa: 0,
          fines: 0,
          transferFee: 0,
          total: 0,
        };

      Object.keys(r).forEach((k) => {
        if (k !== "member") r[k] += Number(t[k] || 0);
      });

      map[key] = r;
    });

    return Object.values(map);
  }, [transactions, viewMode, selectedDate, selectedMonth, selectedYear]);

  /* ---------------- TOTALS ---------------- */

  const totals = useMemo(
    () =>
      displayRows.reduce(
        (acc: any, r: any) => {
          acc.dailyDeposit += r.dailyDeposit;
          acc.loanRepayment += r.loanRepayment;
          acc.welfare += r.welfare;
          acc.shares += r.shares;
          acc.membership += r.membership;
          acc.shaa += r.shaa;
          acc.fines += r.fines;
          acc.transferFee += r.transferFee;
          acc.total += r.total;
          return acc;
        },
        {
          dailyDeposit: 0,
          loanRepayment: 0,
          welfare: 0,
          shares: 0,
          membership: 0,
          shaa: 0,
          fines: 0,
          transferFee: 0,
          total: 0,
        }
      ),
    [displayRows]
  );

  const paginatedRows = displayRows.slice(
    (page - 1) * ROWS_PER_PAGE,
    page * ROWS_PER_PAGE
  );

  /* ---------------- PDF EXPORT ---------------- */
  const exportPdf = () => {
    const doc = new jsPDF({ unit: "pt", format: "a4" });

    let periodLabel = "";
    if (viewMode === "daily") periodLabel = `Date: ${selectedDate}`;
    else if (viewMode === "monthly") periodLabel = `Month: ${selectedMonth}`;
    else periodLabel = `Year: ${selectedYear}`;
 const saccoName = document.title || "SACCO";

const generatedAt = new Date().toLocaleString("en-KE", {
  timeZone: "Africa/Nairobi",
});

/* ---- HEADER LAYOUT ---- */
doc.setFontSize(18);
doc.text(saccoName, 40, 35);

doc.setFontSize(14);
doc.text("Cash Analysis Report", 40, 60);

doc.setFontSize(11);
doc.text(periodLabel, 40, 80);

doc.setFontSize(10);
doc.text(`Generated: ${generatedAt}`, 40, 95);


    const head = [
      [
        "Name",
        "Deposit",
        "Loan",
        "Welfare",
        "Shares",
        "Membership",
        "SHAA",
        "Fines",
        "Transfer Fee",
        "TOTAL",
      ],
    ];

    const body = displayRows.map((r) => [
      r.member,
      r.dailyDeposit,
      r.loanRepayment,
      r.welfare,
      r.shares,
      r.membership,
      r.shaa,
      r.fines,
      r.transferFee,
      r.total,
    ]);

    body.push([
      "TOTALS",
      totals.dailyDeposit,
      totals.loanRepayment,
      totals.welfare,
      totals.shares,
      totals.membership,
      totals.shaa,
      totals.fines,
      totals.transferFee,
      totals.total,
    ]);

   autoTable(doc, {
  head,
  body,
  startY: 115,
  theme: "grid",
});


    doc.save("Transpiaggio_cash_analysis.pdf");
  };

  const money = (n: number) =>
    n > 0 ? `Ksh ${n.toLocaleString()}` : "-";

  /* ---------------- UI ---------------- */

  return (
    <Card>
      <CardHeader className="flex flex-row justify-between">
        <CardTitle>Cash Analysis</CardTitle>

        <div className="flex gap-2">
          <select
            value={viewMode}
            onChange={(e) =>
              setViewMode(e.target.value as "daily" | "monthly" | "yearly")
            }
            className="border rounded px-2"
          >
            <option value="daily">Daily</option>
            <option value="monthly">Monthly</option>
            <option value="yearly">Yearly</option>
          </select>

          {viewMode === "daily" && (
            <Input
              type="date"
              value={selectedDate}
              onChange={(e) => setSelectedDate(e.target.value)}
            />
          )}

          {viewMode === "monthly" && (
            <Input
              type="month"
              value={selectedMonth}
              onChange={(e) => setSelectedMonth(e.target.value)}
            />
          )}

          {viewMode === "yearly" && (
            <Input
              type="number"
              value={selectedYear}
              onChange={(e) => setSelectedYear(Number(e.target.value))}
            />
          )}

          <Button onClick={exportPdf}>Export PDF</Button>
        </div>
      </CardHeader>

      <CardContent>
        <Table>
          <TableHeader>
            <TableRow>
              <TableHead>Name</TableHead>
              <TableHead className="text-right">Deposit</TableHead>
              <TableHead className="text-right">Loan</TableHead>
              <TableHead className="text-right">Welfare</TableHead>
              <TableHead className="text-right">Shares</TableHead>
              <TableHead className="text-right">Membership</TableHead>
              <TableHead className="text-right">SHAA</TableHead>
              <TableHead className="text-right">Fines</TableHead>
              <TableHead className="text-right">Transfer Fee</TableHead>
              <TableHead className="text-right">TOTAL</TableHead>
            </TableRow>
          </TableHeader>

          <TableBody>
            {paginatedRows.map((r, i) => (
              <TableRow key={i}>
                <TableCell>{r.member}</TableCell>
                <TableCell className="text-right">{money(r.dailyDeposit)}</TableCell>
                <TableCell className="text-right">{money(r.loanRepayment)}</TableCell>
                <TableCell className="text-right">{money(r.welfare)}</TableCell>
                <TableCell className="text-right">{money(r.shares)}</TableCell>
                <TableCell className="text-right">{money(r.membership)}</TableCell>
                <TableCell className="text-right">{money(r.shaa)}</TableCell>
                <TableCell className="text-right">{money(r.fines)}</TableCell>
                <TableCell className="text-right">{money(r.transferFee)}</TableCell>
                <TableCell className="text-right font-bold">
                  {money(r.total)}
                </TableCell>
              </TableRow>
            ))}

            <TableRow className="font-bold bg-muted">
              <TableCell>TOTALS</TableCell>
              <TableCell className="text-right">{money(totals.dailyDeposit)}</TableCell>
              <TableCell className="text-right">{money(totals.loanRepayment)}</TableCell>
              <TableCell className="text-right">{money(totals.welfare)}</TableCell>
              <TableCell className="text-right">{money(totals.shares)}</TableCell>
              <TableCell className="text-right">{money(totals.membership)}</TableCell>
              <TableCell className="text-right">{money(totals.shaa)}</TableCell>
              <TableCell className="text-right">{money(totals.fines)}</TableCell>
              <TableCell className="text-right">{money(totals.transferFee)}</TableCell>
              <TableCell className="text-right">{money(totals.total)}</TableCell>
            </TableRow>
          </TableBody>
        </Table>
      </CardContent>
    </Card>
  );
}
