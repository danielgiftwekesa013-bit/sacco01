import { useEffect, useState } from "react";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Skeleton } from "@/components/ui/skeleton";
import { Wallet, TrendingUp, PieChart, Calendar } from "lucide-react";
import { supabase } from "@/lib/supabase";

const DashboardOverview = () => {
  const [loading, setLoading] = useState(true);
  const [stats, setStats] = useState({
    dailyDeposits: 0,
    activeLoans: 0,
    totalSavings: 0,
    sharesValue: 0,
  });

  const [activity, setActivity] = useState<any[]>([]);

  useEffect(() => {
    fetchDashboardData();
  }, []);

  const fetchDashboardData = async () => {
    setLoading(true);

    try {
      // Get logged-in user
      const {
        data: { user },
      } = await supabase.auth.getUser();
      if (!user) {
        console.error("User not logged in");
        setLoading(false);
        return;
      }

      const memberId = user.id;

      // 1. DAILY DEPOSITS (today)
      const today = new Date().toISOString().split("T")[0];
      const { data: deposits } = await supabase
        .from("dailydeposits")
        .select("amount, created_at")
        .eq("member_id", memberId)
        .gte("deposit_date", today);

      const dailyTotal =
        deposits?.reduce((sum, d) => sum + Number(d.amount), 0) || 0;

      // 2. ACTIVE LOANS (user only)
      const { data: loans } = await supabase
        .from("loans")
        .select("loan_balance")
        .eq("member_id", memberId)
        .eq("status", "Active");

      const activeLoanTotal =
        loans?.reduce((sum, l) => sum + Number(l.loan_balance), 0) || 0;

      // 3. TOTAL SAVINGS (latest total_deposit)
      const { data: latestDeposit } = await supabase
        .from("dailydeposits")
        .select("total_deposit")
        .eq("member_id", memberId)
        .order("created_at", { ascending: false })
        .limit(1)
        .single();

      const totalSavings = Number(latestDeposit?.total_deposit || 0);

      // 4. SHARES VALUE (latest total_shares)
      const { data: latestShares } = await supabase
        .from("shares")
        .select("total_shares")
        .eq("member_id", memberId)
        .order("created_at", { ascending: false })
        .limit(1)
        .single();

      const sharesTotal = Number(latestShares?.total_shares || 0);

      // 5. RECENT ACTIVITY (user only)
      const { data: recent } = await supabase
        .from("dailydeposits")
        .select("*")
        .eq("member_id", memberId)
        .order("created_at", { ascending: false })
        .limit(3);

      setStats({
        dailyDeposits: dailyTotal,
        activeLoans: activeLoanTotal,
        totalSavings: totalSavings,
        sharesValue: sharesTotal,
      });

      setActivity(recent || []);
    } catch (error) {
      console.error("Dashboard fetch error:", error);
    }

    setLoading(false);
  };

  const statCards = [
    {
      title: "Daily Deposits",
      value: `KSh ${stats.dailyDeposits.toLocaleString()}`,
      icon: Calendar,
      color: "text-primary",
      bgColor: "bg-primary/10",
    },
    {
      title: "Active Loans",
      value: `KSh ${stats.activeLoans.toLocaleString()}`,
      icon: Wallet,
      color: "text-secondary",
      bgColor: "bg-secondary/10",
    },
    {
      title: "Total Savings",
      value: `KSh ${stats.totalSavings.toLocaleString()}`,
      icon: TrendingUp,
      color: "text-tertiary",
      bgColor: "bg-tertiary/10",
    },
    {
      title: "Shares Value",
      value: `KSh ${stats.sharesValue.toLocaleString()}`,
      icon: PieChart,
      color: "text-quaternary",
      bgColor: "bg-quaternary/10",
    },
  ];

  return (
    <div className="space-y-6 animate-fadeIn">
      <div>
        <h2 className="text-3xl font-bold">Dashboard</h2>
        <p className="text-muted-foreground">
          Welcome back! Here's your financial overview.
        </p>
      </div>

      {/* Stats Section */}
      <div className="grid gap-4 md:grid-cols-2 lg:grid-cols-4">
        {loading
          ? [...Array(4)].map((_, i) => (
              <Card key={i} className="p-4">
                <Skeleton className="h-6 w-32 mb-2" />
                <Skeleton className="h-8 w-24" />
              </Card>
            ))
          : statCards.map((stat, index) => (
              <Card
                key={index}
                className="hover:shadow-lg transition-all duration-300"
              >
                <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
                  <CardTitle className="text-sm font-medium">
                    {stat.title}
                  </CardTitle>
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

      {/* Recent Activity */}
      <Card>
        <CardHeader>
          <CardTitle>Recent Activity</CardTitle>
        </CardHeader>
        <CardContent>
          {loading ? (
            <div className="space-y-3">
              {[...Array(3)].map((_, i) => (
                <Skeleton key={i} className="h-10 w-full" />
              ))}
            </div>
          ) : activity.length === 0 ? (
            <p className="text-muted-foreground text-sm">
              No recent activity yet.
            </p>
          ) : (
            <div className="space-y-4">
              {activity.map((item) => (
                <div
                  key={item.id}
                  className="flex items-center justify-between border-b pb-2"
                >
                  <div>
                    <p className="font-medium">Deposit</p>
                    <p className="text-sm text-muted-foreground">
                      {new Date(item.created_at).toLocaleString()}
                    </p>
                  </div>
                  <span className="font-semibold text-secondary">
                    +KSh {Number(item.amount).toLocaleString()}
                  </span>
                </div>
              ))}
            </div>
          )}
        </CardContent>
      </Card>
    </div>
  );
};

export default DashboardOverview;
