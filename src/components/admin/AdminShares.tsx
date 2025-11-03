import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";

const AdminShares = () => {
  const shareHolders = [
    { member: "John Doe", shares: 60, value: 30000 },
    { member: "Jane Smith", shares: 45, value: 22500 },
    { member: "Peter Wanjala", shares: 30, value: 15000 },
  ];

  const totalShares = shareHolders.reduce((sum, holder) => sum + holder.shares, 0);
  const totalValue = shareHolders.reduce((sum, holder) => sum + holder.value, 0);

  return (
    <div className="space-y-6">
      <div>
        <h2 className="text-3xl font-bold">Shares Management</h2>
        <p className="text-muted-foreground">Track member share holdings</p>
      </div>

      <div className="grid gap-4 md:grid-cols-3">
        <Card>
          <CardHeader>
            <CardTitle className="text-sm">Total Shares</CardTitle>
          </CardHeader>
          <CardContent>
            <p className="text-2xl font-bold">{totalShares}</p>
          </CardContent>
        </Card>

        <Card>
          <CardHeader>
            <CardTitle className="text-sm">Share Value</CardTitle>
          </CardHeader>
          <CardContent>
            <p className="text-2xl font-bold">KSh 500</p>
          </CardContent>
        </Card>

        <Card>
          <CardHeader>
            <CardTitle className="text-sm">Total Value</CardTitle>
          </CardHeader>
          <CardContent>
            <p className="text-2xl font-bold">KSh {totalValue.toLocaleString()}</p>
          </CardContent>
        </Card>
      </div>

      <Card>
        <CardHeader>
          <CardTitle>Share Holders</CardTitle>
        </CardHeader>
        <CardContent>
          <div className="space-y-4">
            {shareHolders.map((holder, index) => (
              <div key={index} className="flex items-center justify-between border-b pb-3 last:border-0">
                <div>
                  <p className="font-medium">{holder.member}</p>
                  <p className="text-sm text-muted-foreground">{holder.shares} shares owned</p>
                </div>
                <p className="text-lg font-semibold">KSh {holder.value.toLocaleString()}</p>
              </div>
            ))}
          </div>
        </CardContent>
      </Card>
    </div>
  );
};

export default AdminShares;
