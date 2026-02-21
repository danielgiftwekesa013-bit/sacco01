"use client";

import { useEffect, useState } from "react";
import { supabase } from "@/lib/supabase";
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
  recorded_by: string | null;
}

const AdminCashFlow = () => {
  const { toast } = useToast();

  /* ================= STATE ================= */
  const [records, setRecords] = useState<LedgerRecord[]>([]);
  const [loading, setLoading] = useState(false);
  const [page, setPage] = useState(1);
  const [pageSize] = useState(10);
  const [totalRecords, setTotalRecords] = useState(0);

  /* ================= SUMMARY ================= */
  const [totalIncome, setTotalIncome] = useState(0);
  const [totalExpense, setTotalExpense] = useState(0);

  /* ================= NEW EXPENSE ================= */
  const [amount, setAmount] = useState("");
  const [category, setCategory] = useState("");
  const [description, setDescription] = useState("");

  /* ================= DATE FILTER ================= */
  const [startDate, setStartDate] = useState("");
  const [endDate, setEndDate] = useState("");

  /* ================= FETCH CASHFLOW ================= */
  const fetchCashFlow = async (page: number, start?: string, end?: string) => {
    setLoading(true);
    const from = (page - 1) * pageSize;
    const to = from + pageSize - 1;

    let query = supabase
      .from("sacco_financial_ledger")
      .select("*", { count: "exact" })
      .order("transaction_date", { ascending: false })
      .range(from, to);

    if (start && end) {
      query = query.gte("transaction_date", start).lte("transaction_date", end);
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

    // Compute totals for summary
    const incomeTotal = (data || [])
      .filter((r) => r.transaction_type === "Income")
      .reduce((sum, r) => sum + Number(r.amount), 0);

    const expenseTotal = (data || [])
      .filter((r) => r.transaction_type === "Expense")
      .reduce((sum, r) => sum + Number(r.amount), 0);

    setTotalIncome(incomeTotal);
    setTotalExpense(expenseTotal);
  };

  useEffect(() => {
    fetchCashFlow(page, startDate, endDate);
  }, [page, startDate, endDate]);

  /* ================= ADD EXPENSE ================= */
  const addExpense = async () => {
    if (!amount || !category) {
      toast({
        title: "Missing data",
        description: "Please provide amount and category",
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
        title: "Error adding expense",
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
    fetchCashFlow(page, startDate, endDate);
  };

  /* ================= PAGINATION ================= */
  const totalPages = Math.ceil(totalRecords / pageSize);

  return (
    <div className="space-y-6">
      <h1 className="text-3xl font-bold">Cash Flow Management</h1>

      {/* ================= SUMMARY ================= */}
      <Card>
        <CardHeader>
          <CardTitle>Summary</CardTitle>
        </CardHeader>
        <CardContent className="flex gap-8">
          <div>Total Income: KSh {totalIncome.toLocaleString()}</div>
          <div>Total Expense: KSh {totalExpense.toLocaleString()}</div>
          <div>Net Cash Flow: KSh {(totalIncome - totalExpense).toLocaleString()}</div>
        </CardContent>
      </Card>

      {/* ================= DATE FILTER ================= */}
      <Card>
        <CardHeader>
          <CardTitle>Filter by Date</CardTitle>
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
          <Button onClick={() => fetchCashFlow(1, startDate, endDate)}>Filter</Button>
          <Button
            variant="secondary"
            onClick={() => {
              setStartDate("");
              setEndDate("");
              fetchCashFlow(1);
            }}
          >
            Reset
          </Button>
        </CardContent>
      </Card>

      {/* ================= ADD EXPENSE ================= */}
      <Card>
        <CardHeader>
          <CardTitle>Add Expense</CardTitle>
        </CardHeader>
        <CardContent className="space-y-4">
          <Input
            type="number"
            placeholder="Amount"
            value={amount}
            onChange={(e) => setAmount(e.target.value)}
          />
          <Input
            type="text"
            placeholder="Category"
            value={category}
            onChange={(e) => setCategory(e.target.value)}
          />
          <Input
            type="text"
            placeholder="Description (optional)"
            value={description}
            onChange={(e) => setDescription(e.target.value)}
          />
          <Button onClick={addExpense}>Add Expense</Button>
        </CardContent>
      </Card>

      {/* ================= CASH FLOW TABLE ================= */}
      <Card>
        <CardHeader>
          <CardTitle>Income & Expense Ledger</CardTitle>
        </CardHeader>
        <CardContent>
          {loading ? (
            <p>Loading...</p>
          ) : (
            <table className="w-full table-auto border-collapse">
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
                    <td className="border p-2">{r.transaction_date}</td>
                    <td className="border p-2">{r.transaction_type}</td>
                    <td className="border p-2">
                      {r.transaction_type === "Income"
                        ? r.income_source
                        : r.expense_category}
                    </td>
                    <td className="border p-2">{r.amount}</td>
                    <td className="border p-2">{r.description}</td>
                  </tr>
                ))}
              </tbody>
            </table>
          )}

          {/* Pagination */}
          <div className="flex justify-between mt-4">
            <Button
              disabled={page === 1}
              onClick={() => setPage((p) => Math.max(p - 1, 1))}
            >
              Previous
            </Button>
            <span>
              Page {page} of {totalPages}
            </span>
            <Button
              disabled={page === totalPages}
              onClick={() => setPage((p) => Math.min(p + 1, totalPages))}
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