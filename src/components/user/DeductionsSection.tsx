"use client";

import { useEffect, useState } from "react";
import { supabase } from "@/lib/supabase";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Input } from "@/components/ui/input";

const DeductionsSection = () => {
  const [userId, setUserId] = useState<string | null>(null);

  const [shaaTotal, setShaaTotal] = useState(0);
  const [fineTotal, setFineTotal] = useState(0);
  const [transferTotal, setTransferTotal] = useState(0);

  const [history, setHistory] = useState<any[]>([]);
  const [filterDate, setFilterDate] = useState("");
  const [loading, setLoading] = useState(true);

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
      Fetch deductions (all time or filtered)
  --------------------------------------------- */
  const fetchDeductions = async (uid: string, date?: string) => {
    setLoading(true);

    let query = supabase
      .from("deductions")
      .select("*")
      .eq("member_id", uid)
      .order("created_at", { ascending: false });

    if (date) {
      query = query.eq("created_at", date);
    }

    const { data, error } = await query;

    if (error) {
      console.error("Fetch deductions error:", error);
      setLoading(false);
      return;
    }

    // Summaries
    let 
      shaa = 0,
      fine = 0,
      transfer = 0;

    data.forEach((d: any) => {
      shaa += Number(d.shaa_fee);
      fine += Number(d.fine_fee);
      transfer += Number(d.transfer_fee);
    });

    setShaaTotal(shaa);
    setFineTotal(fine);
    setTransferTotal(transfer);

    // History formatting
    const formatted: any[] = [];

    data.forEach((row: any) => {
      if (row.shaa_fee > 0)
        formatted.push({
          date: row.created_at.split("T")[0],
          type: "SHAA",
          amount: row.shaa_fee,
        });

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
      Fetch on load + when date filter changes
  --------------------------------------------- */
  useEffect(() => {
    if (!userId) return;

    if (filterDate === "") fetchDeductions(userId);
    else fetchDeductions(userId, filterDate);
  }, [userId, filterDate]);

  if (loading) return <p>Loading...</p>;

  const totalDeductions = shaaTotal + fineTotal + transferTotal;

  return (
    <div className="space-y-6">
      <div className="flex items-center justify-between">
        <div>
          <h2 className="text-3xl font-bold">Deductions</h2>
          <p className="text-muted-foreground">Track SHAA, and fines</p>
        </div>

        <Input
          type="date"
          value={filterDate}
          onChange={(e) => setFilterDate(e.target.value)}
          className="w-48"
        />
      </div>

      {/* Summary */}
      <div className="grid gap-4 md:grid-cols-4">
        <Card>
          <CardHeader>
            <CardTitle className="text-sm">SHAA</CardTitle>
          </CardHeader>
          <CardContent>
            <p className="text-2xl font-bold">
              KSh {shaaTotal.toLocaleString()}
            </p>
          </CardContent>
        </Card>

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
          )}
        </CardContent>
      </Card>
    </div>
  );
};

export default DeductionsSection;
