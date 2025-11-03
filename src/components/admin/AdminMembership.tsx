import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Badge } from "@/components/ui/badge";
import { Input } from "@/components/ui/input";
import { useState } from "react";

const AdminMembership = () => {
  const [searchTerm, setSearchTerm] = useState("");

  const members = [
    { id: "TS-2024-001", name: "John Doe", joined: "2024-01-15", status: "active", feePaid: true },
    { id: "TS-2024-002", name: "Jane Smith", joined: "2024-02-20", status: "active", feePaid: true },
    { id: "TS-2024-003", name: "Peter Wanjala", joined: "2024-03-10", status: "active", feePaid: false },
  ];

  const filteredMembers = members.filter((member) =>
    member.name.toLowerCase().includes(searchTerm.toLowerCase()) ||
    member.id.toLowerCase().includes(searchTerm.toLowerCase())
  );

  return (
    <div className="space-y-6">
      <div>
        <h2 className="text-3xl font-bold">Membership Management</h2>
        <p className="text-muted-foreground">Track and manage Sacco members</p>
      </div>

      <div className="flex gap-4">
        <Input
          placeholder="Search members..."
          value={searchTerm}
          onChange={(e) => setSearchTerm(e.target.value)}
          className="max-w-sm"
        />
      </div>

      <Card>
        <CardHeader>
          <CardTitle>Members List</CardTitle>
        </CardHeader>
        <CardContent>
          <div className="space-y-4">
            {filteredMembers.map((member) => (
              <div key={member.id} className="flex items-center justify-between border-b pb-3 last:border-0">
                <div>
                  <p className="font-medium">{member.name}</p>
                  <p className="text-sm text-muted-foreground">{member.id}</p>
                  <p className="text-xs text-muted-foreground">Joined: {member.joined}</p>
                </div>
                <div className="flex gap-2">
                  <Badge className={member.feePaid ? "bg-secondary" : "bg-destructive"}>
                    {member.feePaid ? "Fee Paid" : "Pending"}
                  </Badge>
                  <Badge className="bg-primary">{member.status}</Badge>
                </div>
              </div>
            ))}
          </div>
        </CardContent>
      </Card>
    </div>
  );
};

export default AdminMembership;
