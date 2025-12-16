import { useEffect, useState } from "react";
import { supabase } from "@/lib/supabase";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Badge } from "@/components/ui/badge";
import { Button } from "@/components/ui/button";
import { Skeleton } from "@/components/ui/skeleton";

const PAGE_SIZE = 10;

const WelfareSection = () => {
  const [userId, setUserId] = useState<string | null>(null);

  const [totalContributed, setTotalContributed] = useState(0);
  const [lastPayment, setLastPayment] = useState<string | null>(null);

  const [history, setHistory] = useState<any[]>([]);
  const [page, setPage] = useState(1);
  const [totalRows, setTotalRows] = useState(0);

  const [loadingSummary, setLoadingSummary] = useState(true);
  const [loadingHistory, setLoadingHistory] = useState(true);

  // ------------------------------------------
  // Load user
  // ------------------------------------------
  useEffect(() => {
    const loadUser = async () => {
      const { data } = await supabase.auth.getUser();
      setUserId(data.user?.id ?? null);
    };
    loadUser();
  }, []);

  // ------------------------------------------
  // Fetch Welfare Summary: total & last payment
  // ------------------------------------------
  useEffect(() => {
    if (!userId) return;

    const fetchSummary = async () => {
      setLoadingSummary(true);

      const { data, error } = await supabase
        .from("wellfare")
        .select("amount, deposit_date")
        .eq("member_id", userId)
        .order("deposit_date", { ascending: false });

      if (error) {
        console.error("Summary error:", error);
        setLoadingSummary(false);
        return;
      }

      const total = data.reduce((sum, row) => sum + Number(row.amount), 0);
      setTotalContributed(total);

      setLastPayment(data.length > 0 ? data[0].deposit_date : "No payments");

      setLoadingSummary(false);
    };

    fetchSummary();
  }, [userId]);

  // ------------------------------------------
  // Fetch Paginated Welfare History
  // ------------------------------------------
  useEffect(() => {
    if (!userId) return;

    const fetchHistory = async () => {
      setLoadingHistory(true);

      const from = (page - 1) * PAGE_SIZE;
      const to = from + PAGE_SIZE - 1;

      const { data, error, count } = await supabase
        .from("wellfare")
        .select("*", { count: "exact" })
        .eq("member_id", userId)
        .order("deposit_date", { ascending: false })
        .range(from, to);

      if (error) {
        console.error("History error:", error);
        setLoadingHistory(false);
        return;
      }

      setHistory(data || []);
      setTotalRows(count || 0);
      setLoadingHistory(false);
    };

    fetchHistory();
  }, [userId, page]);

  const totalPages = Math.ceil(totalRows / PAGE_SIZE);

  // ==================================================================
  // RENDER
  // ==================================================================
  return (
    <div className="space-y-6">
      <div>
        <h2 className="text-3xl font-bold">Welfare</h2>
        <p className="text-muted-foreground">Track your monthly welfare contributions</p>
      </div>

      {/* SUMMARY CARDS */}
      <div className="grid gap-4 md:grid-cols-3">
        <Card>
          <CardHeader>
            <CardTitle className="text-sm">Monthly Contribution</CardTitle>
          </CardHeader>
          <CardContent>
            <p className="text-2xl font-bold">KSh 200</p>
          </CardContent>
        </Card>

        <Card>
          <CardHeader>
            <CardTitle className="text-sm">Total Contributed</CardTitle>
          </CardHeader>
          <CardContent>
            {loadingSummary ? (
              <Skeleton className="h-6 w-24" />
            ) : (
              <p className="text-2xl font-bold">KSh {totalContributed.toLocaleString()}</p>
            )}
          </CardContent>
        </Card>

        <Card>
          <CardHeader>
            <CardTitle className="text-sm">Last Payment</CardTitle>
          </CardHeader>
          <CardContent>
            {loadingSummary ? (
              <Skeleton className="h-6 w-32" />
            ) : (
              <p className="text-2xl font-bold">
                {lastPayment ? lastPayment : "No payments"}
              </p>
            )}
          </CardContent>
        </Card>
      </div>

      {/* PAYMENT HISTORY */}
      <Card>
        <CardHeader>
          <CardTitle>Payment History</CardTitle>
        </CardHeader>
        <CardContent>
          {loadingHistory ? (
            <div className="space-y-3">
              <Skeleton className="h-10" />
              <Skeleton className="h-10" />
              <Skeleton className="h-10" />
            </div>
          ) : history.length === 0 ? (
            <p className="text-muted-foreground">No welfare payments recorded.</p>
          ) : (
            <div className="space-y-4">
              {history.map((payment) => (
                <div
                  key={payment.id}
                  className="flex items-center justify-between border-b pb-2 last:border-0"
                >
                  <div>
                    <p className="font-medium">{payment.deposit_date}</p>
                    <p className="text-sm text-muted-foreground">
                      KSh {Number(payment.amount).toLocaleString()}
                    </p>
                  </div>

                  <Badge
                    className={
                      payment.status === "paid"
                        ? "bg-green-500/20 text-green-600"
                        : "bg-yellow-500/20 text-yellow-700"
                    }
                  >
                    {payment.status}
                  </Badge>
                </div>
              ))}

              {/* PAGINATION */}
              {totalPages > 1 && (
                <div className="flex justify-between items-center pt-4">
                  <Button
                    variant="outline"
                    disabled={page === 1}
                    onClick={() => setPage((p) => Math.max(p - 1, 1))}
                  >
                    Previous
                  </Button>

                  <p className="text-sm text-muted-foreground">
                    Page {page} of {totalPages}
                  </p>

                  <Button
                    variant="outline"
                    disabled={page === totalPages}
                    onClick={() => setPage((p) => Math.min(p + 1, totalPages))}
                  >
                    Next
                  </Button>
                </div>
              )}
            </div>
          )}
        </CardContent>
      </Card>
    </div>
  );
};

export default WelfareSection;
