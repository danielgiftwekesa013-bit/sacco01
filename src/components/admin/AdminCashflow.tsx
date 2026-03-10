"use client";

import { useEffect, useState } from "react";
import { supabase } from "@/lib/supabase";
import jsPDF from "jspdf";
import autoTable from "jspdf-autotable";

import {
  Card,
  CardContent,
  CardHeader,
  CardTitle,
} from "@/components/ui/card";

import { Input } from "@/components/ui/input";
import { Button } from "@/components/ui/button";
import { useToast } from "@/components/ui/use-toast";

interface LedgerRecord {
  id: string;
  transaction_type: "Income" | "Expense";
  income_source: string | null;
  expense_category: string | null;
  amount: number;
  description: string | null;
  transaction_date: string;
}

const AdminCashFlow = () => {
  const { toast } = useToast();

  const [records, setRecords] = useState<LedgerRecord[]>([]);
  const [loading, setLoading] = useState(false);

  const [page, setPage] = useState(1);
  const pageSize = 10;

  const [totalRecords, setTotalRecords] = useState(0);

  /* SUMMARY */
  const [totalIncome, setTotalIncome] = useState(0);
  const [totalExpense, setTotalExpense] = useState(0);

  /* FILTERS */
  const [startDate, setStartDate] = useState("");
  const [endDate, setEndDate] = useState("");

  /* ADD EXPENSE */
  const [amount, setAmount] = useState("");
  const [category, setCategory] = useState("");
  const [description, setDescription] = useState("");

  /* ================= ALL TIME SUMMARY ================= */
  const fetchSummary = async () => {
    const { data, error } = await supabase
      .from("sacco_financial_ledger")
      .select("transaction_type,amount");

    if (error) return;

    const income = data
      ?.filter((r) => r.transaction_type === "Income")
      .reduce((sum, r) => sum + Number(r.amount), 0);

    const expense = data
      ?.filter((r) => r.transaction_type === "Expense")
      .reduce((sum, r) => sum + Number(r.amount), 0);

    setTotalIncome(income || 0);
    setTotalExpense(expense || 0);
  };

  /* ================= FETCH CASHFLOW ================= */
  const fetchCashFlow = async (pageNumber: number) => {
    setLoading(true);

    const from = (pageNumber - 1) * pageSize;
    const to = from + pageSize - 1;

    let query = supabase
      .from("sacco_financial_ledger")
      .select("*", { count: "exact" })
      .order("transaction_date", { ascending: false })
      .range(from, to);

    if (startDate && endDate) {
      query = query.gte("transaction_date", startDate).lte("transaction_date", endDate);
    }

    const { data, count, error } = await query;

    setLoading(false);

    if (error) {
      toast({
        title: "Error fetching records",
        description: error.message,
        variant: "destructive",
      });
      return;
    }

    setRecords(data || []);
    setTotalRecords(count || 0);
  };

 /* ================= PDF DOWNLOAD ================= */
const downloadPDF = async () => {

  let query = supabase
    .from("sacco_financial_ledger")
    .select("*")
    .order("transaction_date", { ascending: false });

  if (startDate && endDate) {
    query = query.gte("transaction_date", startDate).lte("transaction_date", endDate);
  }

  const { data } = await query;

  const records = data || [];

  /* ===== CALCULATE TOTALS ===== */
  const totalIncome = records
    .filter((r) => r.transaction_type === "Income")
    .reduce((sum, r) => sum + Number(r.amount), 0);

  const totalExpense = records
    .filter((r) => r.transaction_type === "Expense")
    .reduce((sum, r) => sum + Number(r.amount), 0);

  const netFlow = totalIncome - totalExpense;

  const doc = new jsPDF();

  /* ===== REPORT TITLE ===== */
  doc.setFontSize(16);
  doc.text("TRANSPIAGGIO SACCO", 14, 15);
  

  /* ===== DATE RANGE ===== */
  doc.setFontSize(10);

  if (startDate && endDate) {
    doc.text(`Date Range: ${startDate} to ${endDate}`, 14, 22);
  } else {
    doc.text("Date Range: All Records", 14, 22);
  }

  /* ===== TOTALS SUMMARY ===== */
  doc.text(`Total Income: KSh ${totalIncome.toLocaleString()}`, 14, 30);
  doc.text(`Total Expense: KSh ${totalExpense.toLocaleString()}`, 14, 36);
  doc.text(`Net Cash Flow: KSh ${netFlow.toLocaleString()}`, 14, 42);

  /* ===== TABLE ===== */
  autoTable(doc, {
    startY: 50,
    head: [["Date", "Type", "Source/Category", "Amount (KSh)", "Description"]],
    body: records.map((r) => [
      r.transaction_date,
      r.transaction_type,
      r.transaction_type === "Income"
        ? r.income_source
        : r.expense_category,
      Number(r.amount).toLocaleString(),
      r.description || "",
    ]),
  });

  /* ===== SAVE PDF ===== */
  doc.save("sacco-cashflow-report.pdf");
};

  /* ================= ADD EXPENSE ================= */
  const addExpense = async () => {
    if (!amount || !category) {
      toast({
        title: "Missing Data",
        description: "Amount and category required",
        variant: "destructive",
      });
      return;
    }

    const { error } = await supabase.from("sacco_financial_ledger").insert({
      transaction_type: "Expense",
      expense_category: category,
      amount: Number(amount),
      description,
      transaction_date: new Date().toISOString().split("T")[0],
    });

    if (error) {
      toast({
        title: "Error",
        description: error.message,
        variant: "destructive",
      });
      return;
    }

    toast({
      title: "Success",
      description: "Expense added",
    });

    setAmount("");
    setCategory("");
    setDescription("");

    fetchCashFlow(page);
    fetchSummary();
  };

  useEffect(() => {
    fetchCashFlow(page);
  }, [page, startDate, endDate]);

  useEffect(() => {
    fetchSummary();
  }, []);

  const totalPages = Math.ceil(totalRecords / pageSize);

  return (
    <div className="space-y-6">

      <h1 className="text-3xl font-bold">Cash Flow Management</h1>

      {/* SUMMARY */}
      <Card>
        <CardHeader>
          <CardTitle>All Time Financial Summary</CardTitle>
        </CardHeader>

        <CardContent className="flex gap-10 text-lg font-medium">

          <div>
            Total Income:  
            <span className="text-green-600 ml-2">
              KSh {totalIncome.toLocaleString()}
            </span>
          </div>

          <div>
            Total Expense:  
            <span className="text-red-600 ml-2">
              KSh {totalExpense.toLocaleString()}
            </span>
          </div>

          <div>
            Net Flow:  
            <span className="ml-2">
              KSh {(totalIncome - totalExpense).toLocaleString()}
            </span>
          </div>

        </CardContent>
      </Card>

      {/* FILTER */}
      <Card>
        <CardHeader>
          <CardTitle>Date Filter</CardTitle>
        </CardHeader>

        <CardContent className="flex gap-4">

          <Input
            type="date"
            value={startDate}
            onChange={(e) => setStartDate(e.target.value)}
          />

          <Input
            type="date"
            value={endDate}
            onChange={(e) => setEndDate(e.target.value)}
          />

          <Button onClick={() => { setPage(1); fetchCashFlow(1); }}>
            Apply Filter
          </Button>

          <Button
            variant="secondary"
            onClick={() => {
              setStartDate("");
              setEndDate("");
              setPage(1);
            }}
          >
            Reset
          </Button>

          <Button onClick={downloadPDF}>
            Download PDF
          </Button>

        </CardContent>
      </Card>

      {/* ADD EXPENSE */}
      <Card>

        <CardHeader>
          <CardTitle>Add Expense</CardTitle>
        </CardHeader>

        <CardContent className="space-y-3">

          <Input
            type="number"
            placeholder="Amount"
            value={amount}
            onChange={(e) => setAmount(e.target.value)}
          />

          <Input
            placeholder="Category"
            value={category}
            onChange={(e) => setCategory(e.target.value)}
          />

          <Input
            placeholder="Description"
            value={description}
            onChange={(e) => setDescription(e.target.value)}
          />

          <Button onClick={addExpense}>
            Add Expense
          </Button>

        </CardContent>
      </Card>

      {/* LEDGER TABLE */}
      <Card>

        <CardHeader>
          <CardTitle>Income & Expense Ledger</CardTitle>
        </CardHeader>

        <CardContent>

          {loading ? (
            <p>Loading...</p>
          ) : (
            <table className="w-full border-collapse">

              <thead>

                <tr>
                  <th className="border p-2">Date</th>
                  <th className="border p-2">Type</th>
                  <th className="border p-2">Source / Category</th>
                  <th className="border p-2">Amount</th>
                  <th className="border p-2">Description</th>
                </tr>

              </thead>

              <tbody>

                {records.map((r) => (
                  <tr key={r.id}>

                    <td className="border p-2">
                      {r.transaction_date}
                    </td>

                    <td className="border p-2">
                      {r.transaction_type}
                    </td>

                    <td className="border p-2">
                      {r.transaction_type === "Income"
                        ? r.income_source
                        : r.expense_category}
                    </td>

                    <td className="border p-2">
                      {Number(r.amount).toLocaleString()}
                    </td>

                    <td className="border p-2">
                      {r.description}
                    </td>

                  </tr>
                ))}

              </tbody>

            </table>
          )}

          {/* PAGINATION */}

          <div className="flex justify-between mt-4">

            <Button
              disabled={page === 1}
              onClick={() => setPage(page - 1)}
            >
              Previous
            </Button>

            <span>
              Page {page} of {totalPages}
            </span>

            <Button
              disabled={page === totalPages}
              onClick={() => setPage(page + 1)}
            >
              Next
            </Button>

          </div>

        </CardContent>

      </Card>

    </div>
  );
};

export default AdminCashFlow;