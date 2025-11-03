import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Wallet, TrendingUp, PieChart, Calendar } from "lucide-react";

const DashboardOverview = () => {
  const stats = [
    {
      title: "Daily Deposits",
      value: "KSh 15,000",
      icon: Calendar,
      color: "text-primary",
      bgColor: "bg-primary/10",
    },
    {
      title: "Active Loans",
      value: "KSh 50,000",
      icon: Wallet,
      color: "text-secondary",
      bgColor: "bg-secondary/10",
    },
    {
      title: "Total Savings",
      value: "KSh 120,000",
      icon: TrendingUp,
      color: "text-tertiary",
      bgColor: "bg-tertiary/10",
    },
    {
      title: "Shares Value",
      value: "KSh 30,000",
      icon: PieChart,
      color: "text-quaternary",
      bgColor: "bg-quaternary/10",
    },
  ];

  return (
    <div className="space-y-6">
      <div>
        <h2 className="text-3xl font-bold">Dashboard</h2>
        <p className="text-muted-foreground">Welcome back! Here's your financial overview.</p>
      </div>

      <div className="grid gap-4 md:grid-cols-2 lg:grid-cols-4">
        {stats.map((stat, index) => (
          <Card key={index}>
            <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
              <CardTitle className="text-sm font-medium">{stat.title}</CardTitle>
              <div className={`rounded-lg p-2 ${stat.bgColor}`}>
                <stat.icon className={`h-4 w-4 ${stat.color}`} />
              </div>
            </CardHeader>
            <CardContent>
              <div className="text-2xl font-bold">{stat.value}</div>
            </CardContent>
          </Card>
        ))}
      </div>

      <Card>
        <CardHeader>
          <CardTitle>Recent Activity</CardTitle>
        </CardHeader>
        <CardContent>
          <div className="space-y-4">
            <div className="flex items-center justify-between border-b pb-2">
              <div>
                <p className="font-medium">Daily Deposit</p>
                <p className="text-sm text-muted-foreground">Today, 10:30 AM</p>
              </div>
              <span className="font-semibold text-secondary">+KSh 500</span>
            </div>
            <div className="flex items-center justify-between border-b pb-2">
              <div>
                <p className="font-medium">Loan Repayment</p>
                <p className="text-sm text-muted-foreground">Yesterday, 2:15 PM</p>
              </div>
              <span className="font-semibold text-destructive">-KSh 2,000</span>
            </div>
            <div className="flex items-center justify-between">
              <div>
                <p className="font-medium">Welfare Contribution</p>
                <p className="text-sm text-muted-foreground">3 days ago</p>
              </div>
              <span className="font-semibold text-secondary">+KSh 1,000</span>
            </div>
          </div>
        </CardContent>
      </Card>
    </div>
  );
};

export default DashboardOverview;
