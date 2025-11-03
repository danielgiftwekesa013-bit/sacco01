import { useState } from "react";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Button } from "@/components/ui/button";
import { Checkbox } from "@/components/ui/checkbox";
import { toast } from "sonner";

const DepositSection = () => {
  const [amount, setAmount] = useState("");
  const [distribution, setDistribution] = useState({
    loanRepayment: false,
    welfare: false,
    membership: false,
    shares: false,
    dailyDeposit: false,
  });

  const handleSubmit = (e: React.FormEvent) => {
    e.preventDefault();
    
    const selectedCategories = Object.entries(distribution)
      .filter(([_, checked]) => checked)
      .map(([category]) => category);

    if (selectedCategories.length === 0) {
      toast.error("Please select at least one category");
      return;
    }

    toast.success(`Deposit of KSh ${amount} processed successfully!`);
    setAmount("");
    setDistribution({
      loanRepayment: false,
      welfare: false,
      membership: false,
      shares: false,
      dailyDeposit: false,
    });
  };

  return (
    <div className="space-y-6">
      <div>
        <h2 className="text-3xl font-bold">Make a Deposit</h2>
        <p className="text-muted-foreground">Distribute your deposit across different categories</p>
      </div>

      <Card>
        <CardHeader>
          <CardTitle>New Deposit</CardTitle>
        </CardHeader>
        <CardContent>
          <form onSubmit={handleSubmit} className="space-y-6">
            <div className="space-y-2">
              <Label htmlFor="depositAmount">Amount (KSh)</Label>
              <Input
                id="depositAmount"
                type="number"
                value={amount}
                onChange={(e) => setAmount(e.target.value)}
                placeholder="Enter amount to deposit"
                required
              />
            </div>

            <div className="space-y-4">
              <Label>Distribute To:</Label>
              
              <div className="space-y-3">
                <div className="flex items-center space-x-2">
                  <Checkbox
                    id="loanRepayment"
                    checked={distribution.loanRepayment}
                    onCheckedChange={(checked) =>
                      setDistribution({ ...distribution, loanRepayment: checked as boolean })
                    }
                  />
                  <label
                    htmlFor="loanRepayment"
                    className="text-sm font-medium leading-none peer-disabled:cursor-not-allowed peer-disabled:opacity-70"
                  >
                    Loan Repayment
                  </label>
                </div>

                <div className="flex items-center space-x-2">
                  <Checkbox
                    id="welfare"
                    checked={distribution.welfare}
                    onCheckedChange={(checked) =>
                      setDistribution({ ...distribution, welfare: checked as boolean })
                    }
                  />
                  <label
                    htmlFor="welfare"
                    className="text-sm font-medium leading-none peer-disabled:cursor-not-allowed peer-disabled:opacity-70"
                  >
                    Welfare
                  </label>
                </div>

                <div className="flex items-center space-x-2">
                  <Checkbox
                    id="membership"
                    checked={distribution.membership}
                    onCheckedChange={(checked) =>
                      setDistribution({ ...distribution, membership: checked as boolean })
                    }
                  />
                  <label
                    htmlFor="membership"
                    className="text-sm font-medium leading-none peer-disabled:cursor-not-allowed peer-disabled:opacity-70"
                  >
                    Membership Fee
                  </label>
                </div>

                <div className="flex items-center space-x-2">
                  <Checkbox
                    id="shares"
                    checked={distribution.shares}
                    onCheckedChange={(checked) =>
                      setDistribution({ ...distribution, shares: checked as boolean })
                    }
                  />
                  <label
                    htmlFor="shares"
                    className="text-sm font-medium leading-none peer-disabled:cursor-not-allowed peer-disabled:opacity-70"
                  >
                    Shares
                  </label>
                </div>

                <div className="flex items-center space-x-2">
                  <Checkbox
                    id="dailyDeposit"
                    checked={distribution.dailyDeposit}
                    onCheckedChange={(checked) =>
                      setDistribution({ ...distribution, dailyDeposit: checked as boolean })
                    }
                  />
                  <label
                    htmlFor="dailyDeposit"
                    className="text-sm font-medium leading-none peer-disabled:cursor-not-allowed peer-disabled:opacity-70"
                  >
                    Daily Deposits
                  </label>
                </div>
              </div>
            </div>

            <Button type="submit" className="w-full bg-gradient-primary">
              Process Deposit
            </Button>
          </form>
        </CardContent>
      </Card>
    </div>
  );
};

export default DepositSection;
