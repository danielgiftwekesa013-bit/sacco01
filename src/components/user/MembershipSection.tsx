import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Badge } from "@/components/ui/badge";
import { CheckCircle2 } from "lucide-react";

const MembershipSection = () => {
  const membershipData = {
    memberSince: "2024-01-15",
    membershipFee: 5000,
    status: "active",
    memberNumber: "TS-2024-001",
  };

  return (
    <div className="space-y-6">
      <div>
        <h2 className="text-3xl font-bold">Membership</h2>
        <p className="text-muted-foreground">Your membership details and status</p>
      </div>

      <Card>
        <CardHeader>
          <CardTitle>Membership Status</CardTitle>
        </CardHeader>
        <CardContent>
          <div className="flex items-center gap-4">
            <div className="flex h-16 w-16 items-center justify-center rounded-full bg-secondary/20">
              <CheckCircle2 className="h-8 w-8 text-secondary" />
            </div>
            <div>
              <Badge className="mb-2 bg-secondary">Active Member</Badge>
              <p className="text-sm text-muted-foreground">Member since {membershipData.memberSince}</p>
            </div>
          </div>
        </CardContent>
      </Card>

      <div className="grid gap-4 md:grid-cols-2">
        <Card>
          <CardHeader>
            <CardTitle className="text-sm">Member Number</CardTitle>
          </CardHeader>
          <CardContent>
            <p className="text-2xl font-bold">{membershipData.memberNumber}</p>
          </CardContent>
        </Card>

        <Card>
          <CardHeader>
            <CardTitle className="text-sm">Membership Fee Paid</CardTitle>
          </CardHeader>
          <CardContent>
            <p className="text-2xl font-bold">KSh {membershipData.membershipFee.toLocaleString()}</p>
          </CardContent>
        </Card>
      </div>

      <Card>
        <CardHeader>
          <CardTitle>Membership Benefits</CardTitle>
        </CardHeader>
        <CardContent>
          <ul className="space-y-2">
            <li className="flex items-start gap-2">
              <CheckCircle2 className="mt-0.5 h-5 w-5 text-secondary" />
              <span>Access to all loan products</span>
            </li>
            <li className="flex items-start gap-2">
              <CheckCircle2 className="mt-0.5 h-5 w-5 text-secondary" />
              <span>Earn dividends on shares</span>
            </li>
            <li className="flex items-start gap-2">
              <CheckCircle2 className="mt-0.5 h-5 w-5 text-secondary" />
              <span>Welfare support and benefits</span>
            </li>
            <li className="flex items-start gap-2">
              <CheckCircle2 className="mt-0.5 h-5 w-5 text-secondary" />
              <span>Voting rights in AGM</span>
            </li>
          </ul>
        </CardContent>
      </Card>
    </div>
  );
};

export default MembershipSection;
