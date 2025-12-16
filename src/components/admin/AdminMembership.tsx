import { useEffect, useState } from "react";
import { supabase } from "@/lib/supabase";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Badge } from "@/components/ui/badge";
import { Input } from "@/components/ui/input";
import { Button } from "@/components/ui/button";
import {
  Dialog,
  DialogContent,
  DialogHeader,
  DialogTitle,
} from "@/components/ui/dialog";

const PAGE_SIZE = 10;
const MODAL_PAGE_SIZE = 10;

const AdminMembership = () => {
  const [members, setMembers] = useState([]);
  const [searchTerm, setSearchTerm] = useState("");
  const [page, setPage] = useState(0);
  const [totalMembers, setTotalMembers] = useState(0);
  const [loading, setLoading] = useState(false);

  const [selectedMember, setSelectedMember] = useState(null);
  const [transactions, setTransactions] = useState([]);
  const [txPage, setTxPage] = useState(0);
  const [txCount, setTxCount] = useState(0);
  const [txLoading, setTxLoading] = useState(false);

  // ========================
  // FETCH GROUPED MEMBERSHIP TOTALS
  // ========================
  const fetchMembers = async () => {
    setLoading(true);

    const from = page * PAGE_SIZE;
    const to = from + PAGE_SIZE - 1;

    const { data, error, count } = await supabase
      .from("membership")
      .select(
        `
        reg_fee,
        member_id,
        userprofiles (
          id,
          user_name,
          member_no,
          phone
        )
      `,
        { count: "exact" }
      )
      .range(from, to);

    if (error) {
      console.error(error);
      setLoading(false);
      return;
    }

    // GROUP BY MEMBER AND SUM REG FEES
    const grouped = {};

    data.forEach((row) => {
      const id = row.member_id;

      if (!grouped[id]) {
        grouped[id] = {
          member_id: id,
          userprofiles: row.userprofiles,
          total_reg_fee: 0,
        };
      }

      grouped[id].total_reg_fee += Number(row.reg_fee);
    });

    setMembers(Object.values(grouped));
    setTotalMembers(count || 0);
    setLoading(false);
  };

  // ========================
  // FETCH MEMBERSHIP TRANSACTIONS (MODAL)
  // ========================
  const fetchTransactions = async (memberId, pageIndex = 0) => {
    setTxLoading(true);

    const from = pageIndex * MODAL_PAGE_SIZE;
    const to = from + MODAL_PAGE_SIZE - 1;

    const { data, error, count } = await supabase
      .from("membership")
      .select(
        `
        id,
        reg_fee,
        status,
        created_at
      `,
        { count: "exact" }
      )
      .eq("member_id", memberId)
      .order("created_at", { ascending: false })
      .range(from, to);

    if (!error) {
      setTransactions(data || []);
      setTxCount(count || 0);
    }

    setTxLoading(false);
  };

  useEffect(() => {
    fetchMembers();
  }, [page]);

  const filteredMembers = members.filter((m) => {
    const name = m.userprofiles?.user_name?.toLowerCase() || "";
    const memberNo = m.userprofiles?.member_no?.toLowerCase() || "";
    const search = searchTerm.toLowerCase();
    return name.includes(search) || memberNo.includes(search);
  });

  return (
    <div className="space-y-6">
      <div>
        <h2 className="text-3xl font-bold">Membership Transactions</h2>
        <p className="text-muted-foreground">
          Grouped membership registration fees per member
        </p>
      </div>

      {/* SEARCH */}
      <Input
        placeholder="Search by name or member no..."
        value={searchTerm}
        onChange={(e) => setSearchTerm(e.target.value)}
        className="max-w-sm"
      />

      <Card>
        <CardHeader>
          <CardTitle>Members</CardTitle>
        </CardHeader>

        <CardContent>
          {loading ? (
            <p className="text-center py-6 text-muted-foreground">
              Loading members...
            </p>
          ) : filteredMembers.length === 0 ? (
            <p className="text-center py-6 text-muted-foreground">
              No members found
            </p>
          ) : (
            <div className="space-y-4">
              {filteredMembers.map((member) => (
                <div
                  key={member.member_id}
                  className="flex items-center justify-between border-b pb-3"
                >
                  <div>
                    <p className="font-medium">
                      {member.userprofiles?.user_name}
                    </p>
                    <p className="text-sm text-muted-foreground">
                      Member No: {member.userprofiles?.member_no}
                    </p>
                    <p className="text-sm text-muted-foreground">
                      Phone: {member.userprofiles?.phone || "N/A"}
                    </p>
                    <p className="text-sm font-semibold mt-1">
                      Total Reg Fees: KES{" "}
                      {member.total_reg_fee.toLocaleString()}
                    </p>
                  </div>

                  <Button
                    variant="outline"
                    onClick={() => {
                      setSelectedMember(member);
                      setTxPage(0);
                      fetchTransactions(member.member_id, 0);
                    }}
                  >
                    View Details
                  </Button>
                </div>
              ))}
            </div>
          )}

          {/* PAGINATION */}
          <div className="flex justify-between items-center mt-6">
            <Button
              disabled={page === 0}
              onClick={() => setPage((p) => Math.max(p - 1, 0))}
            >
              Previous
            </Button>

            <p>
              Page {page + 1} of {Math.ceil(totalMembers / PAGE_SIZE)}
            </p>

            <Button
              disabled={(page + 1) * PAGE_SIZE >= totalMembers}
              onClick={() => setPage((p) => p + 1)}
            >
              Next
            </Button>
          </div>
        </CardContent>
      </Card>

      {/* ================= MODAL ================= */}
      <Dialog open={!!selectedMember} onOpenChange={() => setSelectedMember(null)}>
        <DialogContent className="max-w-2xl">
          <DialogHeader>
            <DialogTitle>
              Membership Transactions –{" "}
              {selectedMember?.userprofiles?.user_name}
            </DialogTitle>
          </DialogHeader>

          {txLoading ? (
            <p className="text-muted-foreground">Loading transactions...</p>
          ) : transactions.length === 0 ? (
            <p className="text-muted-foreground">No transactions found</p>
          ) : (
            <>
              <div className="space-y-3">
                {transactions.map((tx) => (
                  <div
                    key={tx.id}
                    className="flex justify-between border-b pb-2"
                  >
                    <div>
                      <p className="font-medium">
                        Registration Fee
                      </p>
                      <p className="text-xs text-muted-foreground">
                        {new Date(tx.created_at).toLocaleDateString()}
                      </p>
                    </div>

                    <div className="text-right">
                      <p className="font-semibold">
                        KES {tx.reg_fee.toLocaleString()}
                      </p>
                      <Badge
                        className={
                          tx.status === "paid"
                            ? "bg-secondary"
                            : "bg-destructive"
                        }
                      >
                        {tx.status}
                      </Badge>
                    </div>
                  </div>
                ))}
              </div>

              {/* MODAL PAGINATION */}
              <div className="flex justify-between items-center mt-4">
                <Button
                  disabled={txPage === 0}
                  onClick={() => {
                    const newPage = txPage - 1;
                    setTxPage(newPage);
                    fetchTransactions(
                      selectedMember.member_id,
                      newPage
                    );
                  }}
                >
                  Previous
                </Button>

                <p>
                  Page {txPage + 1} of{" "}
                  {Math.ceil(txCount / MODAL_PAGE_SIZE)}
                </p>

                <Button
                  disabled={(txPage + 1) * MODAL_PAGE_SIZE >= txCount}
                  onClick={() => {
                    const newPage = txPage + 1;
                    setTxPage(newPage);
                    fetchTransactions(
                      selectedMember.member_id,
                      newPage
                    );
                  }}
                >
                  Next
                </Button>
              </div>
            </>
          )}
        </DialogContent>
      </Dialog>
    </div>
  );
};

export default AdminMembership;
