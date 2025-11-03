import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Badge } from "@/components/ui/badge";

const AdminWelfare = () => {
  const welfareContributions = [
    { member: "John Doe", amount: 12000, lastPayment: "2025-01-15", status: "current" },
    { member: "Jane Smith", amount: 10000, lastPayment: "2025-01-10", status: "current" },
    { member: "Peter Wanjala", amount: 8000, lastPayment: "2024-12-15", status: "overdue" },
  ];

  return (
    <div className="space-y-6">
      <div>
        <h2 className="text-3xl font-bold">Welfare Management</h2>
        <p className="text-muted-foreground">Track member welfare contributions</p>
      </div>

      <div className="grid gap-4 md:grid-cols-3">
        <Card>
          <CardHeader>
            <CardTitle className="text-sm">Total Contributions</CardTitle>
          </CardHeader>
          <CardContent>
            <p className="text-2xl font-bold">KSh 30,000</p>
          </CardContent>
        </Card>

        <Card>
          <CardHeader>
            <CardTitle className="text-sm">Current Members</CardTitle>
          </CardHeader>
          <CardContent>
            <p className="text-2xl font-bold">2</p>
          </CardContent>
        </Card>

        <Card>
          <CardHeader>
            <CardTitle className="text-sm">Overdue Members</CardTitle>
          </CardHeader>
          <CardContent>
            <p className="text-2xl font-bold text-destructive">1</p>
          </CardContent>
        </Card>
      </div>

      <Card>
        <CardHeader>
          <CardTitle>Member Contributions</CardTitle>
        </CardHeader>
        <CardContent>
          <div className="space-y-4">
            {welfareContributions.map((contribution, index) => (
              <div key={index} className="flex items-center justify-between border-b pb-3 last:border-0">
                <div>
                  <p className="font-medium">{contribution.member}</p>
                  <p className="text-sm text-muted-foreground">Last payment: {contribution.lastPayment}</p>
                </div>
                <div className="flex items-center gap-4">
                  <p className="font-semibold">KSh {contribution.amount.toLocaleString()}</p>
                  <Badge className={contribution.status === "current" ? "bg-secondary" : "bg-destructive"}>
                    {contribution.status}
                  </Badge>
                </div>
              </div>
            ))}
          </div>
        </CardContent>
      </Card>
    </div>
  );
};

export default AdminWelfare;
