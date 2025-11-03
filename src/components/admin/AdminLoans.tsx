import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Badge } from "@/components/ui/badge";
import { Tabs, TabsContent, TabsList, TabsTrigger } from "@/components/ui/tabs";

const AdminLoans = () => {
  const activeLoans = [
    { member: "John Doe", amount: 50000, remaining: 30000, dueDate: "2025-12-31" },
    { member: "Jane Smith", amount: 75000, remaining: 60000, dueDate: "2026-06-30" },
  ];

  const newApplications = [
    { member: "Peter Wanjala", amount: 40000, reason: "Business expansion", date: "2025-01-18" },
    { member: "Mary Akinyi", amount: 30000, reason: "Education", date: "2025-01-19" },
  ];

  const repaidLoans = [
    { member: "Sarah Mwangi", amount: 35000, repaidDate: "2025-01-10" },
  ];

  return (
    <div className="space-y-6">
      <div>
        <h2 className="text-3xl font-bold">Loans Management</h2>
        <p className="text-muted-foreground">Track all loan activities</p>
      </div>

      <div className="grid gap-4 md:grid-cols-3">
        <Card>
          <CardHeader>
            <CardTitle className="text-sm">Active Loans</CardTitle>
          </CardHeader>
          <CardContent>
            <p className="text-2xl font-bold">{activeLoans.length}</p>
            <p className="text-sm text-muted-foreground">KSh 125,000 total</p>
          </CardContent>
        </Card>

        <Card>
          <CardHeader>
            <CardTitle className="text-sm">New Applications</CardTitle>
          </CardHeader>
          <CardContent>
            <p className="text-2xl font-bold">{newApplications.length}</p>
            <p className="text-sm text-muted-foreground">Pending review</p>
          </CardContent>
        </Card>

        <Card>
          <CardHeader>
            <CardTitle className="text-sm">Repaid Loans</CardTitle>
          </CardHeader>
          <CardContent>
            <p className="text-2xl font-bold">{repaidLoans.length}</p>
            <p className="text-sm text-muted-foreground">This month</p>
          </CardContent>
        </Card>
      </div>

      <Tabs defaultValue="active">
        <TabsList className="grid w-full grid-cols-3">
          <TabsTrigger value="active">Active Loans</TabsTrigger>
          <TabsTrigger value="new">New Applications</TabsTrigger>
          <TabsTrigger value="repaid">Repaid</TabsTrigger>
        </TabsList>

        <TabsContent value="active">
          <Card>
            <CardHeader>
              <CardTitle>Active Loans</CardTitle>
            </CardHeader>
            <CardContent>
              <div className="space-y-4">
                {activeLoans.map((loan, index) => (
                  <div key={index} className="flex items-center justify-between border-b pb-3 last:border-0">
                    <div>
                      <p className="font-medium">{loan.member}</p>
                      <p className="text-sm text-muted-foreground">Due: {loan.dueDate}</p>
                    </div>
                    <div className="text-right">
                      <p className="font-semibold">KSh {loan.remaining.toLocaleString()}</p>
                      <p className="text-sm text-muted-foreground">of {loan.amount.toLocaleString()}</p>
                    </div>
                  </div>
                ))}
              </div>
            </CardContent>
          </Card>
        </TabsContent>

        <TabsContent value="new">
          <Card>
            <CardHeader>
              <CardTitle>New Loan Applications</CardTitle>
            </CardHeader>
            <CardContent>
              <div className="space-y-4">
                {newApplications.map((app, index) => (
                  <div key={index} className="flex items-center justify-between border-b pb-3 last:border-0">
                    <div>
                      <p className="font-medium">{app.member}</p>
                      <p className="text-sm text-muted-foreground">{app.reason}</p>
                      <p className="text-xs text-muted-foreground">Applied: {app.date}</p>
                    </div>
                    <div className="flex items-center gap-3">
                      <p className="font-semibold">KSh {app.amount.toLocaleString()}</p>
                      <Badge className="bg-quaternary">Pending</Badge>
                    </div>
                  </div>
                ))}
              </div>
            </CardContent>
          </Card>
        </TabsContent>

        <TabsContent value="repaid">
          <Card>
            <CardHeader>
              <CardTitle>Fully Repaid Loans</CardTitle>
            </CardHeader>
            <CardContent>
              <div className="space-y-4">
                {repaidLoans.map((loan, index) => (
                  <div key={index} className="flex items-center justify-between border-b pb-3 last:border-0">
                    <div>
                      <p className="font-medium">{loan.member}</p>
                      <p className="text-sm text-muted-foreground">Repaid: {loan.repaidDate}</p>
                    </div>
                    <div className="flex items-center gap-3">
                      <p className="font-semibold">KSh {loan.amount.toLocaleString()}</p>
                      <Badge className="bg-secondary">Completed</Badge>
                    </div>
                  </div>
                ))}
              </div>
            </CardContent>
          </Card>
        </TabsContent>
      </Tabs>
    </div>
  );
};

export default AdminLoans;
