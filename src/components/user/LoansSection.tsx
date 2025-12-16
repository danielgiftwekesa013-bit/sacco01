import { useState, useEffect, useRef } from "react";
import { motion } from "framer-motion";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Textarea } from "@/components/ui/textarea";
import { Badge } from "@/components/ui/badge";
import { PlusCircle } from "lucide-react";
import { toast } from "sonner";
import { supabase } from "@/lib/supabase";
import { Skeleton } from "@/components/ui/skeleton";

/**
 * LoansSection
 *
 * - Eligibility check animation when opening the application form (1.2s)
 * - "Calculating loan breakdown..." small loader when user types amount/period
 * - Manual months input allowed (max 36)
 * - Full-card overlay loader during submission
 * - Minimal Framer Motion fades
 */

const FADE = { hidden: { opacity: 0, y: 6 }, visible: { opacity: 1, y: 0 } };

export default function LoansSection() {
  const [showApplication, setShowApplication] = useState(false);

  const [loanAmount, setLoanAmount] = useState("");
  const [loanReason, setLoanReason] = useState("");
  const [loanPeriod, setLoanPeriod] = useState(""); // months (string so user can type)

  const [eligibleAmount, setEligibleAmount] = useState(0);
  const [activeLoans, setActiveLoans] = useState<any[]>([]);

  const [calculations, setCalculations] = useState({
    rate: 0,
    interest: 0,
    total: 0,
    dueDate: "",
  });

  const [userId, setUserId] = useState<string | null>(null);

  // Loading / UI states
  const [eligibilityChecking, setEligibilityChecking] = useState(false);
  const [calcLoading, setCalcLoading] = useState(false);
  const [submitting, setSubmitting] = useState(false);
  const [initialLoading, setInitialLoading] = useState(true);

  // used to debounce calculation loader
  const calcTimerRef = useRef<number | null>(null);

  // HELPER FUNCTIONS FOR ELIGIBILITY
  const getTotalDepositAtDate = async (memberId: string, date: string) => {
    const { data } = await supabase
      .from("dailydeposits")
      .select("total_deposit")
      .eq("member_id", memberId)
      .lte("deposit_date", date)
      .order("deposit_date", { ascending: false })
      .limit(1)
      .single();

    return Number(data?.total_deposit || 0);
  };

  const getLatestTotalDeposit = async (memberId: string) => {
    const { data } = await supabase
      .from("dailydeposits")
      .select("total_deposit")
      .eq("member_id", memberId)
      .order("created_at", { ascending: false })
      .limit(1)
      .single();

    return Number(data?.total_deposit || 0);
  };

  // load user
  useEffect(() => {
    const loadUser = async () => {
      const { data } = await supabase.auth.getUser();
      setUserId(data.user?.id ?? null);
      setInitialLoading(false);
    };
    loadUser();
  }, []);

  // fetch user data after userId loaded
  useEffect(() => {
    if (!userId) return;
    fetchSavingsAndLoans();
  }, [userId]);

  const fetchSavingsAndLoans = async () => {
    try {
      // Fetch all loans for this user
      const { data: loans, error } = await supabase
        .from("loans")
        .select(`
          id,
          principle,
          loan_balance,
          interest,
          rate,
          time,
          due_date,
          application_date,
          reason,
          status
        `)
        .eq("member_id", userId);

      if (error) throw error;

      const active = loans?.filter((l) => l.status === "Active") || [];

      // Compute eligible amount using new logic
      let eligible = 0;
      const latestTotal = await getLatestTotalDeposit(userId);

      if (active.length === 0) {
        // No active loan → full savings × 3
        eligible = latestTotal * 3;
      } else {
        // Has active loan
        const latestLoan = active.sort(
          (a, b) =>
            new Date(b.application_date).getTime() -
            new Date(a.application_date).getTime()
        )[0];

        const loanDateTotal = await getTotalDepositAtDate(
          userId,
          latestLoan.application_date
        );

        const difference = Math.abs(latestTotal - loanDateTotal);
        eligible = difference * 3;
      }

      setEligibleAmount(eligible);
      setActiveLoans(loans || []);
    } catch (err) {
      console.error("fetchSavingsAndLoans:", err);
    }
  };

  // When form opens, run the 'Checking eligibility' flow
  useEffect(() => {
    if (!showApplication) return;

    let mounted = true;
    (async () => {
      setEligibilityChecking(true);
      await new Promise((r) => setTimeout(r, 1200));

      if (!mounted || !userId) return;

      try {
        // Re-run eligibility logic on form open
        const { data: loans } = await supabase
          .from("loans")
          .select("application_date, status")
          .eq("member_id", userId);

        const active = loans?.filter((l) => l.status === "Active") || [];

        const latestTotal = await getLatestTotalDeposit(userId);

        if (active.length === 0) {
          setEligibleAmount(latestTotal * 3);
        } else {
          const latestLoan = active.sort(
            (a, b) =>
              new Date(b.application_date).getTime() -
              new Date(a.application_date).getTime()
          )[0];

          const loanDateTotal = await getTotalDepositAtDate(
            userId,
            latestLoan.application_date
          );

          const diff = Math.abs(latestTotal - loanDateTotal);
          setEligibleAmount(diff * 3);
        }
      } catch (err) {
        console.error("eligibility fetch:", err);
      } finally {
        setEligibilityChecking(false);
      }
    })();

    return () => {
      mounted = false;
    };
  }, [showApplication, userId]);

  // Calculation effect with a tiny "Calculating loan breakdown..." loader
  useEffect(() => {
    if (calcTimerRef.current) {
      window.clearTimeout(calcTimerRef.current);
      calcTimerRef.current = null;
    }

    if (!loanAmount || !loanPeriod) {
      setCalculations({ rate: 0, interest: 0, total: 0, dueDate: "" });
      setCalcLoading(false);
      return;
    }

    setCalcLoading(true);
    calcTimerRef.current = window.setTimeout(() => {
      const p = Number(loanAmount || 0);
      const t = Number(loanPeriod || 0);

      if (t <= 0 || t > 36 || Number.isNaN(t)) {
        setCalcLoading(false);
        setCalculations({ rate: 0, interest: 0, total: 0, dueDate: "" });
        return;
      }

      const rate = t <= 3 ? 10 : 15;
      const interest = (p * rate * (t / 12)) / 100;
      const total = p + interest;

      const due = new Date();
      due.setMonth(due.getMonth() + t);

      setCalculations({
        rate,
        interest,
        total,
        dueDate: due.toISOString().split("T")[0],
      });

      setCalcLoading(false);
    }, 700);

    return () => {
      if (calcTimerRef.current) {
        window.clearTimeout(calcTimerRef.current);
        calcTimerRef.current = null;
      }
    };
  }, [loanAmount, loanPeriod]);

  // apply loan
  const handleApply = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!userId) {
      toast.error("User session expired.");
      return;
    }

    const amount = Number(loanAmount || 0);
    const months = Number(loanPeriod || 0);

    if (!amount || amount <= 0) {
      toast.error("Enter a valid loan amount.");
      return;
    }

    if (!months || months <= 0 || months > 36) {
      toast.error("Enter a valid loan period (1 - 36 months).");
      return;
    }

    if (amount > eligibleAmount) {
      toast.error("You cannot borrow more than your eligible limit.");
      return;
    }

    setSubmitting(true);

    try {
      const { error } = await supabase.from("loans").insert({
        member_id: userId,
        principle: amount,
        rate: calculations.rate,
        interest: calculations.interest,
        time: months,
        due_date: calculations.dueDate,
        reason: loanReason,
        status: "Pending",
      });

      if (error) {
        console.error("loan insert error:", error);
        toast.error("Error applying for loan.");
        setSubmitting(false);
        return;
      }

      toast.success("Loan application submitted!");
      setShowApplication(false);
      setLoanAmount("");
      setLoanReason("");
      setLoanPeriod("");
      setCalculations({ rate: 0, interest: 0, total: 0, dueDate: "" });

      await fetchSavingsAndLoans();
    } catch (err) {
      console.error("submit error:", err);
      toast.error("Error applying for loan.");
    } finally {
      setSubmitting(false);
    }
  };

  const Spinner = () => (
    <div className="w-10 h-10 border-4 border-t-transparent rounded-full animate-spin" />
  );

  return (
    <div className="space-y-6">
      {/* Header */}
      <div className="flex items-center justify-between">
        <div>
          <h2 className="text-3xl font-bold">Loans</h2>
          <p className="text-muted-foreground">Manage your loans and applications</p>
        </div>
        <Button
          onClick={() => setShowApplication((s) => !s)}
          className="bg-gradient-primary"
        >
          <PlusCircle className="mr-2 h-4 w-4" />
          Apply for Loan
        </Button>
      </div>

      {/* Application Card (animated reveal) */}
      <motion.div
        initial="hidden"
        animate={showApplication ? "visible" : "hidden"}
        variants={FADE}
        transition={{ duration: 0.22 }}
      >
        {showApplication && (
          <Card className="relative overflow-visible">
            {/* Submission overlay */}
            {submitting && (
              <div className="absolute inset-0 z-30 flex items-center justify-center bg-black/40 rounded">
                <div className="flex flex-col items-center gap-3 bg-white/90 dark:bg-gray-800/90 p-6 rounded-lg">
                  <Spinner />
                  <div className="text-sm font-medium">
                    Submitting your loan application…
                  </div>
                </div>
              </div>
            )}

            <CardHeader>
              <CardTitle>New Loan Application</CardTitle>
            </CardHeader>

            <CardContent>
              {/* Eligibility banner area */}
              <div className="p-3 mb-4 rounded-lg border bg-secondary/10 text-sm">
                {eligibilityChecking ? (
                  <div className="flex items-center gap-2">
                    <Skeleton className="h-4 w-48" />
                    <small className="text-xs text-muted-foreground">
                      Checking eligibility…
                    </small>
                  </div>
                ) : (
                  <div className="flex items-center justify-between gap-4">
                    <div>
                      <strong>Eligible Loan Amount:</strong>{" "}
                      <span className="ml-2">
                        KSh {eligibleAmount.toLocaleString()}
                      </span>
                      <div className="text-xs text-muted-foreground">
                        Eligible = 3 × total savings
                      </div>
                    </div>
                    <div>
                      <Badge className="bg-primary/20">Quick check</Badge>
                    </div>
                  </div>
                )}
              </div>

              <form onSubmit={handleApply} className="space-y-4">
                <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                  {/* Loan Amount */}
                  <div className="space-y-2">
                    <Label htmlFor="loanAmount">Loan Amount (KSh)</Label>
                    <Input
                      id="loanAmount"
                      type="number"
                      min={1}
                      value={loanAmount}
                      onChange={(e) => setLoanAmount(e.target.value)}
                      placeholder="Enter loan amount"
                      required
                    />
                  </div>

                  {/* Loan Period (manual input allowed) */}
                  <div className="space-y-2">
                    <Label htmlFor="loanPeriod">Loan Period (Months)</Label>
                    <Input
                      id="loanPeriod"
                      type="number"
                      min={1}
                      max={36}
                      value={loanPeriod}
                      onChange={(e) => {
                        const raw = e.target.value.replace(/[^\d]/g, "");
                        if (raw === "") {
                          setLoanPeriod("");
                          return;
                        }
                        const n = Math.min(Number(raw), 36);
                        setLoanPeriod(String(n));
                      }}
                      placeholder="Enter months (max 36)"
                      required
                    />
                    <div className="text-xs text-muted-foreground">
                      Max: 36 months. ≤3 months → 10% p.a. · &gt;3 months → 15% p.a.
                    </div>
                  </div>
                </div>

                {/* Reason */}
                <div className="space-y-2">
                  <Label htmlFor="loanReason">Reason for Loan</Label>
                  <Textarea
                    id="loanReason"
                    value={loanReason}
                    onChange={(e) => setLoanReason(e.target.value)}
                    placeholder="Eg: School fees, business capital..."
                    required
                  />
                </div>

                {/* Calculation / Loader */}
                <div>
                  {calcLoading ? (
                    <div className="flex items-center gap-2 text-sm text-muted-foreground">
                      <Skeleton className="h-4 w-40" />
                      <span>Calculating loan breakdown…</span>
                    </div>
                  ) : calculations.total ? (
                    <motion.div
                      initial={{ opacity: 0, y: 6 }}
                      animate={{ opacity: 1, y: 0 }}
                      transition={{ duration: 0.18 }}
                    >
                      <Card className="border p-4 rounded-lg bg-muted/40">
                        <h4 className="font-semibold mb-2">Loan Breakdown</h4>
                        <div className="grid grid-cols-2 gap-2">
                          <div className="text-sm text-muted-foreground">Interest Rate</div>
                          <div className="font-medium">{calculations.rate}% p.a.</div>

                          <div className="text-sm text-muted-foreground">Interest Amount</div>
                          <div className="font-medium">
                            KSh {Number(calculations.interest).toLocaleString()}
                          </div>

                          <div className="text-sm text-muted-foreground">Total Loan</div>
                          <div className="font-medium">
                            KSh {Number(calculations.total).toLocaleString()}
                          </div>

                          <div className="text-sm text-muted-foreground">Due Date</div>
                          <div className="font-medium">{calculations.dueDate}</div>
                        </div>
                      </Card>
                    </motion.div>
                  ) : (
                    <div className="text-sm text-muted-foreground">
                      Enter amount and months to see a breakdown.
                    </div>
                  )}
                </div>

                {/* Actions */}
                <div className="flex gap-2">
                  <Button
                    type="submit"
                    className="bg-gradient-primary"
                    disabled={submitting || eligibilityChecking || calcLoading}
                  >
                    {submitting ? "Submitting…" : "Submit Application"}
                  </Button>

                  <Button
                    type="button"
                    variant="outline"
                    onClick={() => setShowApplication(false)}
                    disabled={submitting}
                  >
                    Cancel
                  </Button>
                </div>
              </form>
            </CardContent>
          </Card>
        )}
      </motion.div>

      {/* Active Loans list */}
      <motion.div
        initial="hidden"
        animate="visible"
        variants={FADE}
        transition={{ duration: 0.22 }}
      >
        <Card>
          <CardHeader>
            <CardTitle>Active Loans</CardTitle>
          </CardHeader>
          <CardContent>
            {initialLoading ? (
              <div className="space-y-2">
                <Skeleton className="h-6 w-56" />
                <Skeleton className="h-10" />
                <Skeleton className="h-10" />
              </div>
            ) : activeLoans.length === 0 ? (
              <p className="text-muted-foreground">You have no active loans.</p>
            ) : (
              <div className="space-y-4">
                {activeLoans.map((loan) => (
                  <motion.div
                    key={loan.id}
                    initial={{ opacity: 0, y: 6 }}
                    animate={{ opacity: 1, y: 0 }}
                    transition={{ duration: 0.18 }}
                    className="rounded-lg border p-4"
                  >
                    <div className="flex items-start justify-between">
                      <div>
                        <h4 className="font-semibold">{loan.reason || "Loan"}</h4>
                        <p className="text-sm text-muted-foreground">Due: {loan.due_date}</p>
                      </div>
                      <Badge
                        className={loan.status === "Active" ? "bg-secondary" : "bg-yellow-500"}
                      >
                        {loan.status}
                      </Badge>
                    </div>

                    <div className="mt-4 grid grid-cols-2 gap-4">
                      <div>
                        <p className="text-sm text-muted-foreground">Principal Amount</p>
                        <p className="text-lg font-semibold">
                          KSh {Number(loan.principle).toLocaleString()}
                        </p>
                      </div>
                      <div>
                        <p className="text-sm text-muted-foreground">Remaining</p>
                        <p className="text-lg font-semibold">
                          KSh {Number(loan.loan_balance).toLocaleString()}
                        </p>
                      </div>
                    </div>
                  </motion.div>
                ))}
              </div>
            )}
          </CardContent>
        </Card>
      </motion.div>
    </div>
  );
}
