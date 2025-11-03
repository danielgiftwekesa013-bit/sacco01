import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Badge } from "@/components/ui/badge";

const AdminDailyDeposits = () => {
  const deposits = [
    { member: "John Doe", amount: 500, date: "2025-01-20", status: "on-time" },
    { member: "Jane Smith", amount: 500, date: "2025-01-20", status: "on-time" },
    { member: "Peter Wanjala", amount: 500, date: "2025-01-19", status: "late", fine: 10 },
  ];

  const totalToday = deposits
    .filter((d) => d.date === "2025-01-20")
    .reduce((sum, d) => sum + d.amount, 0);

  return (
    <div className="space-y-6">
      <div>
        <h2 className="text-3xl font-bold">Daily Deposits</h2>
        <p className="text-muted-foreground">Track all user daily deposits</p>
      </div>

      <div className="grid gap-4 md:grid-cols-3">
        <Card>
          <CardHeader>
            <CardTitle className="text-sm">Today's Deposits</CardTitle>
          </CardHeader>
          <CardContent>
            <p className="text-2xl font-bold">KSh {totalToday.toLocaleString()}</p>
          </CardContent>
        </Card>

        <Card>
          <CardHeader>
            <CardTitle className="text-sm">On-Time Deposits</CardTitle>
          </CardHeader>
          <CardContent>
            <p className="text-2xl font-bold">2</p>
          </CardContent>
        </Card>

        <Card>
          <CardHeader>
            <CardTitle className="text-sm">Late Deposits</CardTitle>
          </CardHeader>
          <CardContent>
            <p className="text-2xl font-bold text-destructive">1</p>
          </CardContent>
        </Card>
      </div>

      <Card>
        <CardHeader>
          <CardTitle>Recent Deposits</CardTitle>
        </CardHeader>
        <CardContent>
          <div className="space-y-4">
            {deposits.map((deposit, index) => (
              <div key={index} className="flex items-center justify-between border-b pb-3 last:border-0">
                <div>
                  <p className="font-medium">{deposit.member}</p>
                  <p className="text-sm text-muted-foreground">{deposit.date}</p>
                  {deposit.fine && (
                    <p className="text-xs text-destructive">Fine: KSh {deposit.fine}</p>
                  )}
                </div>
                <div className="flex items-center gap-3">
                  <p className="font-semibold">KSh {deposit.amount}</p>
                  <Badge className={deposit.status === "on-time" ? "bg-secondary" : "bg-destructive"}>
                    {deposit.status === "on-time" ? "On Time" : "Late"}
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

export default AdminDailyDeposits;
