import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Badge } from "@/components/ui/badge";

const WelfareSection = () => {
  const welfareData = {
    monthlyContribution: 1000,
    totalContributed: 12000,
    lastPayment: "2025-01-15",
  };

  const history = [
    { date: "2025-01-15", amount: 1000, status: "paid" },
    { date: "2024-12-15", amount: 1000, status: "paid" },
    { date: "2024-11-15", amount: 1000, status: "paid" },
  ];

  return (
    <div className="space-y-6">
      <div>
        <h2 className="text-3xl font-bold">Welfare</h2>
        <p className="text-muted-foreground">Track your monthly welfare contributions</p>
      </div>

      <div className="grid gap-4 md:grid-cols-3">
        <Card>
          <CardHeader>
            <CardTitle className="text-sm">Monthly Contribution</CardTitle>
          </CardHeader>
          <CardContent>
            <p className="text-2xl font-bold">KSh {welfareData.monthlyContribution.toLocaleString()}</p>
          </CardContent>
        </Card>

        <Card>
          <CardHeader>
            <CardTitle className="text-sm">Total Contributed</CardTitle>
          </CardHeader>
          <CardContent>
            <p className="text-2xl font-bold">KSh {welfareData.totalContributed.toLocaleString()}</p>
          </CardContent>
        </Card>

        <Card>
          <CardHeader>
            <CardTitle className="text-sm">Last Payment</CardTitle>
          </CardHeader>
          <CardContent>
            <p className="text-2xl font-bold">{welfareData.lastPayment}</p>
          </CardContent>
        </Card>
      </div>

      <Card>
        <CardHeader>
          <CardTitle>Payment History</CardTitle>
        </CardHeader>
        <CardContent>
          <div className="space-y-3">
            {history.map((payment, index) => (
              <div key={index} className="flex items-center justify-between border-b pb-2 last:border-0">
                <div>
                  <p className="font-medium">{payment.date}</p>
                  <p className="text-sm text-muted-foreground">KSh {payment.amount.toLocaleString()}</p>
                </div>
                <Badge className="bg-secondary">Paid</Badge>
              </div>
            ))}
          </div>
        </CardContent>
      </Card>
    </div>
  );
};

export default WelfareSection;
