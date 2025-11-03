import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Badge } from "@/components/ui/badge";
import { AlertCircle, CheckCircle2 } from "lucide-react";

const DailyDepositSection = () => {
  const depositData = {
    dailyTarget: 500,
    totalDeposited: 15000,
    fines: 30,
    currentStreak: 15,
  };

  const recentDeposits = [
    { date: "2025-01-20", amount: 500, status: "on-time" },
    { date: "2025-01-19", amount: 500, status: "on-time" },
    { date: "2025-01-18", amount: 500, status: "late", fine: 10 },
    { date: "2025-01-17", amount: 500, status: "on-time" },
  ];

  return (
    <div className="space-y-6">
      <div>
        <h2 className="text-3xl font-bold">Daily Deposits</h2>
        <p className="text-muted-foreground">Track your daily savings and fines</p>
      </div>

      <div className="grid gap-4 md:grid-cols-4">
        <Card>
          <CardHeader>
            <CardTitle className="text-sm">Daily Target</CardTitle>
          </CardHeader>
          <CardContent>
            <p className="text-2xl font-bold">KSh {depositData.dailyTarget}</p>
          </CardContent>
        </Card>

        <Card>
          <CardHeader>
            <CardTitle className="text-sm">Total Deposited</CardTitle>
          </CardHeader>
          <CardContent>
            <p className="text-2xl font-bold">KSh {depositData.totalDeposited.toLocaleString()}</p>
          </CardContent>
        </Card>

        <Card>
          <CardHeader>
            <CardTitle className="text-sm">Current Streak</CardTitle>
          </CardHeader>
          <CardContent>
            <p className="text-2xl font-bold">{depositData.currentStreak} days</p>
          </CardContent>
        </Card>

        <Card>
          <CardHeader>
            <CardTitle className="text-sm">Total Fines</CardTitle>
          </CardHeader>
          <CardContent>
            <p className="text-2xl font-bold text-destructive">KSh {depositData.fines}</p>
            <p className="text-xs text-muted-foreground">KSh 10 per late deposit</p>
          </CardContent>
        </Card>
      </div>

      <Card>
        <CardHeader>
          <CardTitle>Recent Deposits</CardTitle>
        </CardHeader>
        <CardContent>
          <div className="space-y-3">
            {recentDeposits.map((deposit, index) => (
              <div key={index} className="flex items-center justify-between border-b pb-3 last:border-0">
                <div className="flex items-center gap-3">
                  {deposit.status === "on-time" ? (
                    <CheckCircle2 className="h-5 w-5 text-secondary" />
                  ) : (
                    <AlertCircle className="h-5 w-5 text-destructive" />
                  )}
                  <div>
                    <p className="font-medium">{deposit.date}</p>
                    <p className="text-sm text-muted-foreground">
                      KSh {deposit.amount}
                      {deposit.fine && ` + KSh ${deposit.fine} fine`}
                    </p>
                  </div>
                </div>
                <Badge className={deposit.status === "on-time" ? "bg-secondary" : "bg-destructive"}>
                  {deposit.status === "on-time" ? "On Time" : "Late"}
                </Badge>
              </div>
            ))}
          </div>
        </CardContent>
      </Card>
    </div>
  );
};

export default DailyDepositSection;
