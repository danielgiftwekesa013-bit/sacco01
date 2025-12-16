import { useEffect, useState } from "react";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Users, Wallet, TrendingUp } from "lucide-react";
import { supabase } from "@/lib/supabase";
import {
  LineChart,
  Line,
  XAxis,
  YAxis,
  CartesianGrid,
  Tooltip,
  Legend,
  PieChart,
  Pie,
  Cell,
  ResponsiveContainer,
} from "recharts";

const COLORS = ["#0088FE", "#00C49F", "#FFBB28", "#FF8042"];

const AdminDashboardOverview = () => {
  const [stats, setStats] = useState({
    members: 0,
    activeLoansAmount: 0,
    totalDeposits: 0,
  });
  const [monthlyDeposits, setMonthlyDeposits] = useState<any[]>([]);
  const [loansVsTotalContrib, setLoansVsTotalContrib] = useState<any[]>([]);
  const [cashDistribution, setCashDistribution] = useState<any[]>([]);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    const fetchData = async () => {
      setLoading(true);

      try {
        // -------------------- Stats --------------------
        const { count: membersCount } = await supabase
          .from("userprofiles")
          .select("*", { count: "exact", head: true });

        const { data: loansData } = await supabase
          .from("loans")
          .select("member_id, total_loan")
          .eq("status", "Active");

        const activeLoansAmount = loansData?.reduce(
          (sum, l) => sum + Number(l.total_loan || 0),
          0
        );

        const { data: depositsData } = await supabase
          .from("dailydeposits")
          .select("member_id, amount");

        const totalDeposits = depositsData?.reduce((sum, d) => sum + Number(d.amount || 0), 0);

        setStats({ members: membersCount || 0, activeLoansAmount, totalDeposits });

        // -------------------- Monthly Deposits --------------------
        const { data: monthlyDepositsData } = await supabase
          .from("dailydeposits")
          .select("member_id, amount, deposit_date")
          .order("deposit_date", { ascending: true });

        const depositsByMonth: Record<string, number> = {};
        monthlyDepositsData?.forEach((d) => {
          const month = d.deposit_date.slice(0, 7); // YYYY-MM
          depositsByMonth[month] = (depositsByMonth[month] || 0) + Number(d.amount);
        });
        setMonthlyDeposits(
          Object.entries(depositsByMonth).map(([month, amount]) => ({ month, amount }))
        );

        // -------------------- Loans vs Total Contributions --------------------
        const { data: sharesData } = await supabase.from("shares").select("member_id, amount, deposit_date");
        const { data: welfareData } = await supabase.from("wellfare").select("member_id, amount, deposit_date");
        const { data: membershipData } = await supabase.from("membership").select("member_id, reg_fee, reg_date");

        const monthlyMap: Record<string, { loans: number; contributions: number }> = {};

        // Aggregate Loans
        loansData?.forEach((loan) => {
          const month = new Date().toISOString().slice(0, 7); // Placeholder for month, can be refined
          monthlyMap[month] = monthlyMap[month] || { loans: 0, contributions: 0 };
          monthlyMap[month].loans += Number(loan.total_loan || 0);
        });

        // Aggregate Deposits
        monthlyDepositsData?.forEach((d) => {
          const month = d.deposit_date.slice(0, 7);
          monthlyMap[month] = monthlyMap[month] || { loans: 0, contributions: 0 };
          monthlyMap[month].contributions += Number(d.amount);
        });

        // Aggregate Shares
        sharesData?.forEach((s) => {
          const month = s.deposit_date.slice(0, 7);
          monthlyMap[month] = monthlyMap[month] || { loans: 0, contributions: 0 };
          monthlyMap[month].contributions += Number(s.amount);
        });

        // Aggregate Welfare
        welfareData?.forEach((w) => {
          const month = w.deposit_date.slice(0, 7);
          monthlyMap[month] = monthlyMap[month] || { loans: 0, contributions: 0 };
          monthlyMap[month].contributions += Number(w.amount);
        });

        // Aggregate Membership
        membershipData?.forEach((m) => {
          const month = m.reg_date.slice(0, 7);
          monthlyMap[month] = monthlyMap[month] || { loans: 0, contributions: 0 };
          monthlyMap[month].contributions += Number(m.reg_fee || 0);
        });

        setLoansVsTotalContrib(
          Object.entries(monthlyMap).map(([month, val]) => ({
            month,
            Loans: val.loans,
            Contributions: val.contributions,
          }))
        );

        // -------------------- Cash Distribution --------------------
        const { data: paymentsData } = await supabase
          .from("payments_ledger")
          .select("member_id, payment_for, amount");

        const distMap: Record<string, number> = {};
        paymentsData?.forEach((p) => {
          const key = p.payment_for;
          distMap[key] = (distMap[key] || 0) + Number(p.amount);
        });

        setCashDistribution(
          Object.entries(distMap).map(([name, value]) => ({ name, value }))
        );
      } catch (error) {
        console.error("Dashboard fetch error:", error);
      }

      setLoading(false);
    };

    fetchData();
  }, []);

  const statCards = [
    { title: "Active Members", value: stats.members.toLocaleString(), icon: Users, color: "text-primary", bgColor: "bg-primary/10" },
    { title: "Active Loans", value: `KSh ${stats.activeLoansAmount.toLocaleString()}`, icon: Wallet, color: "text-secondary", bgColor: "bg-secondary/10" },
    { title: "Total Deposits", value: `KSh ${stats.totalDeposits.toLocaleString()}`, icon: TrendingUp, color: "text-tertiary", bgColor: "bg-tertiary/10" },
  ];

  if (loading) return <div className="text-center py-10 text-muted-foreground">Loading dashboard...</div>;

  return (
    <div className="space-y-6">
      <div>
        <h2 className="text-3xl font-bold">Admin Dashboard</h2>
        <p className="text-muted-foreground">Overview of Sacco operations</p>
      </div>

      {/* -------------------- Stat Cards -------------------- */}
      <div className="grid gap-4 md:grid-cols-3">
        {statCards.map((stat, i) => (
          <Card key={i}>
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

      {/* -------------------- Monthly Deposits Trend -------------------- */}
      <Card>
        <CardHeader>
          <CardTitle>Monthly Deposits Trend</CardTitle>
        </CardHeader>
        <CardContent>
          <ResponsiveContainer width="100%" height={300}>
            <LineChart data={monthlyDeposits}>
              <CartesianGrid strokeDasharray="3 3" />
              <XAxis dataKey="month" />
              <YAxis />
              <Tooltip />
              <Legend />
              <Line type="monotone" dataKey="amount" stroke="#8884d8" />
            </LineChart>
          </ResponsiveContainer>
        </CardContent>
      </Card>

      {/* -------------------- Loans vs Total Contributions -------------------- */}
      <Card>
        <CardHeader>
          <CardTitle>Loans vs Total Contributions</CardTitle>
        </CardHeader>
        <CardContent>
          <ResponsiveContainer width="100%" height={300}>
            <LineChart data={loansVsTotalContrib}>
              <CartesianGrid strokeDasharray="3 3" />
              <XAxis dataKey="month" />
              <YAxis />
              <Tooltip />
              <Legend />
              <Line type="monotone" dataKey="Loans" stroke="#FF8042" />
              <Line type="monotone" dataKey="Contributions" stroke="#0088FE" />
            </LineChart>
          </ResponsiveContainer>
        </CardContent>
      </Card>

      {/* -------------------- Cash Distribution Pie Chart -------------------- */}
      <Card>
        <CardHeader>
          <CardTitle>Cash Distribution</CardTitle>
        </CardHeader>
        <CardContent>
          <ResponsiveContainer width="100%" height={300}>
            <PieChart>
              <Pie
                data={cashDistribution}
                dataKey="value"
                nameKey="name"
                cx="50%"
                cy="50%"
                outerRadius={100}
                label
              >
                {cashDistribution.map((entry, index) => (
                  <Cell key={`cell-${index}`} fill={COLORS[index % COLORS.length]} />
                ))}
              </Pie>
              <Tooltip />
            </PieChart>
          </ResponsiveContainer>
        </CardContent>
      </Card>
    </div>
  );
};

export default AdminDashboardOverview;
