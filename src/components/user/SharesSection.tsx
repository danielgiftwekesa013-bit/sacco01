import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Progress } from "@/components/ui/progress";

const SharesSection = () => {
  const sharesData = {
    totalShares: 60,
    shareValue: 500,
    totalValue: 30000,
    targetShares: 100,
  };

  const progress = (sharesData.totalShares / sharesData.targetShares) * 100;

  return (
    <div className="space-y-6">
      <div>
        <h2 className="text-3xl font-bold">Shares</h2>
        <p className="text-muted-foreground">Track your Sacco shares and investments</p>
      </div>

      <div className="grid gap-4 md:grid-cols-2">
        <Card>
          <CardHeader>
            <CardTitle className="text-sm">Total Shares Owned</CardTitle>
          </CardHeader>
          <CardContent>
            <p className="text-3xl font-bold">{sharesData.totalShares}</p>
            <p className="mt-2 text-sm text-muted-foreground">
              Target: {sharesData.targetShares} shares
            </p>
            <Progress value={progress} className="mt-2" />
          </CardContent>
        </Card>

        <Card>
          <CardHeader>
            <CardTitle className="text-sm">Share Value</CardTitle>
          </CardHeader>
          <CardContent>
            <p className="text-3xl font-bold">KSh {sharesData.shareValue.toLocaleString()}</p>
            <p className="mt-2 text-sm text-muted-foreground">Per share</p>
          </CardContent>
        </Card>
      </div>

      <Card>
        <CardHeader>
          <CardTitle>Total Investment Value</CardTitle>
        </CardHeader>
        <CardContent>
          <p className="text-4xl font-bold text-primary">
            KSh {sharesData.totalValue.toLocaleString()}
          </p>
          <p className="mt-2 text-sm text-muted-foreground">
            {sharesData.totalShares} shares × KSh {sharesData.shareValue}
          </p>
        </CardContent>
      </Card>

      <Card>
        <CardHeader>
          <CardTitle>Recent Share Purchases</CardTitle>
        </CardHeader>
        <CardContent>
          <div className="space-y-3">
            <div className="flex justify-between border-b pb-2">
              <span>2025-01-10</span>
              <span className="font-semibold">+5 shares</span>
            </div>
            <div className="flex justify-between border-b pb-2">
              <span>2024-12-10</span>
              <span className="font-semibold">+5 shares</span>
            </div>
            <div className="flex justify-between">
              <span>2024-11-10</span>
              <span className="font-semibold">+5 shares</span>
            </div>
          </div>
        </CardContent>
      </Card>
    </div>
  );
};

export default SharesSection;
