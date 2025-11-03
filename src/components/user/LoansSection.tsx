import { useState } from "react";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Textarea } from "@/components/ui/textarea";
import { Badge } from "@/components/ui/badge";
import { PlusCircle } from "lucide-react";
import { toast } from "sonner";

const LoansSection = () => {
  const [showApplication, setShowApplication] = useState(false);
  const [loanReason, setLoanReason] = useState("");
  const [loanAmount, setLoanAmount] = useState("");

  const activeLoans = [
    {
      id: 1,
      type: "Business Loan",
      amount: 50000,
      remaining: 30000,
      dueDate: "2025-12-31",
      status: "active",
    },
  ];

  const handleApply = (e: React.FormEvent) => {
    e.preventDefault();
    toast.success("Loan application submitted successfully!");
    setShowApplication(false);
    setLoanReason("");
    setLoanAmount("");
  };

  return (
    <div className="space-y-6">
      <div className="flex items-center justify-between">
        <div>
          <h2 className="text-3xl font-bold">Loans</h2>
          <p className="text-muted-foreground">Manage your loans and applications</p>
        </div>
        <Button onClick={() => setShowApplication(!showApplication)} className="bg-gradient-primary">
          <PlusCircle className="mr-2 h-4 w-4" />
          Apply for Loan
        </Button>
      </div>

      {showApplication && (
        <Card>
          <CardHeader>
            <CardTitle>New Loan Application</CardTitle>
          </CardHeader>
          <CardContent>
            <form onSubmit={handleApply} className="space-y-4">
              <div className="space-y-2">
                <Label htmlFor="loanAmount">Loan Amount (KSh)</Label>
                <Input
                  id="loanAmount"
                  type="number"
                  value={loanAmount}
                  onChange={(e) => setLoanAmount(e.target.value)}
                  placeholder="Enter amount"
                  required
                />
              </div>
              <div className="space-y-2">
                <Label htmlFor="loanReason">Reason for Loan</Label>
                <Textarea
                  id="loanReason"
                  value={loanReason}
                  onChange={(e) => setLoanReason(e.target.value)}
                  placeholder="Describe why you need this loan"
                  required
                />
              </div>
              <div className="flex gap-2">
                <Button type="submit" className="bg-gradient-primary">Submit Application</Button>
                <Button type="button" variant="outline" onClick={() => setShowApplication(false)}>
                  Cancel
                </Button>
              </div>
            </form>
          </CardContent>
        </Card>
      )}

      <Card>
        <CardHeader>
          <CardTitle>Active Loans</CardTitle>
        </CardHeader>
        <CardContent>
          <div className="space-y-4">
            {activeLoans.map((loan) => (
              <div key={loan.id} className="rounded-lg border p-4">
                <div className="flex items-start justify-between">
                  <div>
                    <h4 className="font-semibold">{loan.type}</h4>
                    <p className="text-sm text-muted-foreground">Due: {loan.dueDate}</p>
                  </div>
                  <Badge className="bg-secondary">Active</Badge>
                </div>
                <div className="mt-4 grid grid-cols-2 gap-4">
                  <div>
                    <p className="text-sm text-muted-foreground">Original Amount</p>
                    <p className="text-lg font-semibold">KSh {loan.amount.toLocaleString()}</p>
                  </div>
                  <div>
                    <p className="text-sm text-muted-foreground">Remaining</p>
                    <p className="text-lg font-semibold">KSh {loan.remaining.toLocaleString()}</p>
                  </div>
                </div>
              </div>
            ))}
          </div>
        </CardContent>
      </Card>
    </div>
  );
};

export default LoansSection;
