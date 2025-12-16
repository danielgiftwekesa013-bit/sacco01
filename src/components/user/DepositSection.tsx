import { useState, useEffect } from "react";
import { supabase } from "@/lib/supabase";
import { saccoCheckout } from "@/services/saccoPayments";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Button } from "@/components/ui/button";
import { toast } from "sonner";

interface Loan {
  id: string;
  reason: string;
  loan_balance: number;
}

const DepositSection = () => {
  const [userId, setUserId] = useState<string | null>(null);
  const [phone, setPhone] = useState<string>("");

  const [amounts, setAmounts] = useState({
    dailyDeposit: 0,
    loanRepayment: 0,
    shares: 0,
    welfare: 0,
    membership: 0,
  });

  const [activeLoans, setActiveLoans] = useState<Loan[]>([]);
  const [selectedLoan, setSelectedLoan] = useState<string>("");
  const [total, setTotal] = useState(0);

  // Normalize phone numbers
  const normalizePhone = (raw: string) => {
    let p = raw.replace(/\D/g, ""); // strip non-numbers
    if (p.startsWith("07")) p = "254" + p.substring(1);
    if (p.startsWith("01")) p = "254" + p.substring(1);
    return p;
  };

  useEffect(() => {
    const loadUser = async () => {
      const { data } = await supabase.auth.getUser();
      const uid = data.user?.id ?? null;
      setUserId(uid);

      if (uid) {
        fetchLoans(uid);
        fetchUserPhone(uid);
      }
    };
    loadUser();
  }, []);

  const fetchUserPhone = async (uid: string) => {
    const { data } = await supabase
      .from("userprofiles")
      .select("phone")
      .eq("id", uid)
      .single();
    setPhone(data?.phone || "");
  };

  const fetchLoans = async (uid: string) => {
    const { data } = await supabase
      .from("loans")
      .select("*")
      .eq("member_id", uid)
      .neq("status", "Repaid");

    setActiveLoans(data as Loan[]);
  };

  useEffect(() => {
    const t =
      (amounts.dailyDeposit || 0) +
      (amounts.loanRepayment || 0) +
      (amounts.shares || 0) +
      (amounts.welfare || 0) +
      (amounts.membership || 0);

    setTotal(t);
  }, [amounts]);

  const handlePay = async () => {
  if (!userId) return toast.error("User session expired");

  const normalizedPhone = normalizePhone(phone);
  if (!/^254\d{9}$/.test(normalizedPhone)) {
    return toast.error("Invalid phone number");
  }

  if (total <= 0) return toast.error("Enter at least one amount");

  if (amounts.loanRepayment > 0 && !selectedLoan) {
    return toast.error("Select which loan you are paying");
  }

  toast("Processing MPESA...");

  try {
    // Construct breakdown object
    const breakdown: Breakdown = {
      dailyDeposit: amounts.dailyDeposit || 0,
      loanRepayment: amounts.loanRepayment
        ? { loan_id: selectedLoan, amount: amounts.loanRepayment }
        : null,
      shares: amounts.shares || 0,
      welfare: amounts.welfare || 0,
      membership: amounts.membership || 0,
    };

    // ✅ Call saccoPayments service correctly
    const { request, stk } = await saccoCheckout({
      memberId: userId,
      phone: normalizedPhone,
      breakdown,
      paymentFor: "MixedPayment",
      relatedId: selectedLoan || null,
    });

    toast.success("STK Push initiated! Check your phone to complete payment.");

    console.log("STK request:", request);
    console.log("Backend response:", stk);
  } catch (error: any) {
    console.error("Payment error:", error);
    toast.error(error.message || "Failed to process MPESA payment");
  }
};



  return (
    <div className="space-y-6">
      <div>
        <h2 className="text-3xl font-bold">Make a Deposit</h2>
        <p className="text-muted-foreground">Distribute your deposit across categories</p>
      </div>

      <Card>
        <CardHeader>
          <CardTitle>Deposit Details</CardTitle>
        </CardHeader>

        <CardContent className="space-y-5">
          {/* Phone */}
          <div>
            <Label>MPESA Phone Number</Label>
            <Input
              value={phone}
              onChange={(e) => setPhone(e.target.value)}
              placeholder="e.g. 0712345678"
            />
          </div>

          {/* Daily Deposit */}
          <div>
            <Label>Daily Deposit (KSh)</Label>
            <Input
              type="number"
              value={amounts.dailyDeposit}
              onChange={(e) =>
                setAmounts((prev) => ({ ...prev, dailyDeposit: Number(e.target.value) }))
              }
              placeholder="Enter amount"
            />
          </div>

          {/* Loan Repayment */}
          {activeLoans.length > 0 && (
            <div className="space-y-3">
              <div>
                <Label>Select Loan</Label>
                <select
                  className="w-full border rounded p-2"
                  value={selectedLoan}
                  onChange={(e) => setSelectedLoan(e.target.value)}
                >
                  <option value="">-- Choose Loan --</option>
                  {activeLoans.map((loan) => (
                    <option key={loan.id} value={loan.id}>
                      {loan.reason} → Balance: {loan.loan_balance}
                    </option>
                  ))}
                </select>
              </div>

              <div>
                <Label>Loan Repayment Amount (KSh)</Label>
                <Input
                  type="number"
                  value={amounts.loanRepayment}
                  onChange={(e) =>
                    setAmounts((prev) => ({
                      ...prev,
                      loanRepayment: Number(e.target.value),
                    }))
                  }
                  placeholder="Enter amount to pay"
                />
              </div>
            </div>
          )}

          {/* Shares */}
          <div>
            <Label>Shares (KSh)</Label>
            <Input
              type="number"
              value={amounts.shares}
              onChange={(e) =>
                setAmounts((prev) => ({ ...prev, shares: Number(e.target.value) }))
              }
            />
          </div>

          {/* Welfare */}
          <div>
            <Label>Welfare (KSh)</Label>
            <Input
              type="number"
              value={amounts.welfare}
              onChange={(e) =>
                setAmounts((prev) => ({ ...prev, welfare: Number(e.target.value) }))
              }
            />
          </div>

          {/* Membership */}
          <div>
            <Label>Membership (KSh)</Label>
            <Input
              type="number"
              value={amounts.membership}
              onChange={(e) =>
                setAmounts((prev) => ({ ...prev, membership: Number(e.target.value) }))
              }
            />
          </div>

          {/* Total */}
          <div className="mt-4">
            <p className="text-lg font-semibold">Total: KSh {total}</p>

            <Button className="w-full bg-gradient-primary" onClick={handlePay}>
              Pay via MPESA
            </Button>
          </div>
        </CardContent>
      </Card>
    </div>
  );
};

export default DepositSection;
