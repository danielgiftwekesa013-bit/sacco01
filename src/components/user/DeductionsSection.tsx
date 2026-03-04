"use client";

import { useEffect, useState } from "react";
import { supabase } from "@/lib/supabase";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Input } from "@/components/ui/input";
import { Button } from "@/components/ui/button";

const PAGE_SIZE = 10;

const DeductionsSection = () => {
  const [userId, setUserId] = useState<string | null>(null);

  const [fineTotal, setFineTotal] = useState(0);
  const [transferTotal, setTransferTotal] = useState(0);

  const [history, setHistory] = useState<any[]>([]);
  const [filterDate, setFilterDate] = useState("");
  const [loading, setLoading] = useState(true);

  const [page, setPage] = useState(1);
  const [totalCount, setTotalCount] = useState(0);

  /* ---------------------------------------------
      Get logged-in user
  --------------------------------------------- */
  useEffect(() => {
    (async () => {
      const { data } = await supabase.auth.getUser();
      const id = data?.user?.id ?? null;
      setUserId(id);
    })();
  }, []);

  /* ---------------------------------------------
      Fetch deductions (paginated)
  --------------------------------------------- */
  const fetchDeductions = async (
    uid: string,
    pageNumber: number,
    date?: string
  ) => {
    setLoading(true);

    const from = (pageNumber - 1) * PAGE_SIZE;
    const to = from + PAGE_SIZE - 1;

    let query = supabase
      .from("deductions")
      .select("*", { count: "exact" })
      .eq("member_id", uid)
      .order("created_at", { ascending: false })
      .range(from, to);

    if (date) {
      query = query.eq("created_at", date);
    }

    const { data, error, count } = await query;

    if (error) {
      console.error("Fetch deductions error:", error);
      setLoading(false);
      return;
    }

    setTotalCount(count || 0);

    // Calculate totals (for all records, not just current page)
    const { data: allData } = await supabase
      .from("deductions")
      .select("fine_fee, transfer_fee")
      .eq("member_id", uid);

    let fine = 0;
    let transfer = 0;

    allData?.forEach((d: any) => {
      fine += Number(d.fine_fee);
      transfer += Number(d.transfer_fee);
    });

    setFineTotal(fine);
    setTransferTotal(transfer);

    // Format history
    const formatted: any[] = [];

    data?.forEach((row: any) => {
      if (row.fine_fee > 0)
        formatted.push({
          date: row.created_at.split("T")[0],
          type: "Fine",
          amount: row.fine_fee,
        });

      if (row.transfer_fee > 0)
        formatted.push({
          date: row.created_at.split("T")[0],
          type: "Transfer Fee",
          amount: row.transfer_fee,
        });
    });

    setHistory(formatted);
    setLoading(false);
  };

  /* ---------------------------------------------
      Trigger fetch
  --------------------------------------------- */
  useEffect(() => {
    if (!userId) return;

    fetchDeductions(userId, page, filterDate || undefined);
  }, [userId, page, filterDate]);

  /* Reset to page 1 when filtering */
  useEffect(() => {
    setPage(1);
  }, [filterDate]);

  if (loading) return <p>Loading...</p>;

  const totalDeductions = fineTotal + transferTotal;
  const totalPages = Math.ceil(totalCount / PAGE_SIZE);

  return (
    <div className="space-y-6">
      <div className="flex items-center justify-between">
        <div>
          <h2 className="text-3xl font-bold">Deductions</h2>
          <p className="text-muted-foreground">
            Track fines and transfer fees
          </p>
        </div>

        <Input
          type="date"
          value={filterDate}
          onChange={(e) => setFilterDate(e.target.value)}
          className="w-48"
        />
      </div>

      {/* Summary */}
      <div className="grid gap-4 md:grid-cols-3">
        <Card>
          <CardHeader>
            <CardTitle className="text-sm">Fines</CardTitle>
          </CardHeader>
          <CardContent>
            <p className="text-2xl font-bold text-destructive">
              KSh {fineTotal.toLocaleString()}
            </p>
          </CardContent>
        </Card>

        <Card>
          <CardHeader>
            <CardTitle className="text-sm">Transfer Fees</CardTitle>
          </CardHeader>
          <CardContent>
            <p className="text-2xl font-bold text-destructive">
              KSh {transferTotal.toLocaleString()}
            </p>
          </CardContent>
        </Card>

        <Card className="border-primary">
          <CardHeader>
            <CardTitle className="text-sm">Total Deductions</CardTitle>
          </CardHeader>
          <CardContent>
            <p className="text-2xl font-bold">
              KSh {totalDeductions.toLocaleString()}
            </p>
          </CardContent>
        </Card>
      </div>

      {/* History */}
      <Card>
        <CardHeader>
          <CardTitle>
            {filterDate ? `Deductions on ${filterDate}` : "Deduction History"}
          </CardTitle>
        </CardHeader>
        <CardContent>
          {history.length === 0 ? (
            <p className="text-sm text-muted-foreground">No records found.</p>
          ) : (
            <>
              <div className="space-y-3">
                {history.map((item, index) => (
                  <div
                    key={index}
                    className="flex items-center justify-between border-b pb-2 last:border-0"
                  >
                    <div>
                      <p className="font-medium">{item.type}</p>
                      <p className="text-sm text-muted-foreground">
                        {item.date}
                      </p>
                    </div>

                    <span className="font-semibold text-destructive">
                      -KSh {Number(item.amount).toLocaleString()}
                    </span>
                  </div>
                ))}
              </div>

              {/* Pagination Controls */}
              <div className="flex items-center justify-between mt-6">
                <Button
                  variant="outline"
                  disabled={page === 1}
                  onClick={() => setPage((prev) => prev - 1)}
                >
                  Previous
                </Button>

                <span className="text-sm text-muted-foreground">
                  Page {page} of {totalPages || 1}
                </span>

                <Button
                  variant="outline"
                  disabled={page >= totalPages}
                  onClick={() => setPage((prev) => prev + 1)}
                >
                  Next
                </Button>
              </div>
            </>
          )}
        </CardContent>
      </Card>
    </div>
  );
};

export default DeductionsSection;