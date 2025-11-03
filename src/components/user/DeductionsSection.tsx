import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";

const DeductionsSection = () => {
  const deductions = {
    nhif: 1500,
    shaa: 2000,
    fines: 30,
    total: 3530,
  };

  const history = [
    { date: "2025-01-15", type: "NHIF", amount: 1500 },
    { date: "2025-01-15", type: "SHAA", amount: 2000 },
    { date: "2025-01-10", type: "Fine", amount: 10 },
    { date: "2024-12-15", type: "NHIF", amount: 1500 },
  ];

  return (
    <div className="space-y-6">
      <div>
        <h2 className="text-3xl font-bold">Deductions</h2>
        <p className="text-muted-foreground">Track NHIF, SHAA, and fines</p>
      </div>

      <div className="grid gap-4 md:grid-cols-4">
        <Card>
          <CardHeader>
            <CardTitle className="text-sm">NHIF</CardTitle>
          </CardHeader>
          <CardContent>
            <p className="text-2xl font-bold">KSh {deductions.nhif.toLocaleString()}</p>
          </CardContent>
        </Card>

        <Card>
          <CardHeader>
            <CardTitle className="text-sm">SHAA</CardTitle>
          </CardHeader>
          <CardContent>
            <p className="text-2xl font-bold">KSh {deductions.shaa.toLocaleString()}</p>
          </CardContent>
        </Card>

        <Card>
          <CardHeader>
            <CardTitle className="text-sm">Fines</CardTitle>
          </CardHeader>
          <CardContent>
            <p className="text-2xl font-bold text-destructive">KSh {deductions.fines}</p>
          </CardContent>
        </Card>

        <Card className="border-primary">
          <CardHeader>
            <CardTitle className="text-sm">Total Deductions</CardTitle>
          </CardHeader>
          <CardContent>
            <p className="text-2xl font-bold">KSh {deductions.total.toLocaleString()}</p>
          </CardContent>
        </Card>
      </div>

      <Card>
        <CardHeader>
          <CardTitle>Deduction History</CardTitle>
        </CardHeader>
        <CardContent>
          <div className="space-y-3">
            {history.map((item, index) => (
              <div key={index} className="flex items-center justify-between border-b pb-2 last:border-0">
                <div>
                  <p className="font-medium">{item.type}</p>
                  <p className="text-sm text-muted-foreground">{item.date}</p>
                </div>
                <span className="font-semibold text-destructive">
                  -KSh {item.amount.toLocaleString()}
                </span>
              </div>
            ))}
          </div>
        </CardContent>
      </Card>
    </div>
  );
};

export default DeductionsSection;
