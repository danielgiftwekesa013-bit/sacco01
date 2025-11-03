import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Tabs, TabsContent, TabsList, TabsTrigger } from "@/components/ui/tabs";

const AdminDeductions = () => {
  const nhifDeductions = [
    { member: "John Doe", amount: 1500, date: "2025-01-15" },
    { member: "Jane Smith", amount: 1500, date: "2025-01-15" },
  ];

  const shaaDeductions = [
    { member: "John Doe", amount: 2000, date: "2025-01-15" },
    { member: "Jane Smith", amount: 2000, date: "2025-01-15" },
  ];

  const fines = [
    { member: "Peter Wanjala", amount: 10, reason: "Late deposit", date: "2025-01-19" },
    { member: "Mary Akinyi", amount: 20, reason: "Late deposit (2 days)", date: "2025-01-18" },
  ];

  return (
    <div className="space-y-6">
      <div>
        <h2 className="text-3xl font-bold">Deductions Management</h2>
        <p className="text-muted-foreground">Track NHIF, SHAA, and fines</p>
      </div>

      <div className="grid gap-4 md:grid-cols-3">
        <Card>
          <CardHeader>
            <CardTitle className="text-sm">NHIF Deductions</CardTitle>
          </CardHeader>
          <CardContent>
            <p className="text-2xl font-bold">KSh 3,000</p>
          </CardContent>
        </Card>

        <Card>
          <CardHeader>
            <CardTitle className="text-sm">SHAA Deductions</CardTitle>
          </CardHeader>
          <CardContent>
            <p className="text-2xl font-bold">KSh 4,000</p>
          </CardContent>
        </Card>

        <Card>
          <CardHeader>
            <CardTitle className="text-sm">Total Fines</CardTitle>
          </CardHeader>
          <CardContent>
            <p className="text-2xl font-bold text-destructive">KSh 30</p>
          </CardContent>
        </Card>
      </div>

      <Tabs defaultValue="nhif">
        <TabsList className="grid w-full grid-cols-3">
          <TabsTrigger value="nhif">NHIF</TabsTrigger>
          <TabsTrigger value="shaa">SHAA</TabsTrigger>
          <TabsTrigger value="fines">Fines</TabsTrigger>
        </TabsList>

        <TabsContent value="nhif">
          <Card>
            <CardHeader>
              <CardTitle>NHIF Deductions</CardTitle>
            </CardHeader>
            <CardContent>
              <div className="space-y-4">
                {nhifDeductions.map((deduction, index) => (
                  <div key={index} className="flex items-center justify-between border-b pb-3 last:border-0">
                    <div>
                      <p className="font-medium">{deduction.member}</p>
                      <p className="text-sm text-muted-foreground">{deduction.date}</p>
                    </div>
                    <p className="font-semibold">KSh {deduction.amount.toLocaleString()}</p>
                  </div>
                ))}
              </div>
            </CardContent>
          </Card>
        </TabsContent>

        <TabsContent value="shaa">
          <Card>
            <CardHeader>
              <CardTitle>SHAA Deductions</CardTitle>
            </CardHeader>
            <CardContent>
              <div className="space-y-4">
                {shaaDeductions.map((deduction, index) => (
                  <div key={index} className="flex items-center justify-between border-b pb-3 last:border-0">
                    <div>
                      <p className="font-medium">{deduction.member}</p>
                      <p className="text-sm text-muted-foreground">{deduction.date}</p>
                    </div>
                    <p className="font-semibold">KSh {deduction.amount.toLocaleString()}</p>
                  </div>
                ))}
              </div>
            </CardContent>
          </Card>
        </TabsContent>

        <TabsContent value="fines">
          <Card>
            <CardHeader>
              <CardTitle>Fines</CardTitle>
            </CardHeader>
            <CardContent>
              <div className="space-y-4">
                {fines.map((fine, index) => (
                  <div key={index} className="flex items-center justify-between border-b pb-3 last:border-0">
                    <div>
                      <p className="font-medium">{fine.member}</p>
                      <p className="text-sm text-muted-foreground">{fine.reason}</p>
                      <p className="text-xs text-muted-foreground">{fine.date}</p>
                    </div>
                    <p className="font-semibold text-destructive">KSh {fine.amount}</p>
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

export default AdminDeductions;
