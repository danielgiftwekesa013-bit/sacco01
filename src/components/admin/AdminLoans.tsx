import { useState, useEffect } from "react";
import { supabase } from "@/lib/supabase";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Badge } from "@/components/ui/badge";
import { Tabs, TabsContent, TabsList, TabsTrigger } from "@/components/ui/tabs";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";

const PAGE_SIZE = 10;

/* -------------------- MODAL -------------------- */
const Modal = ({ open, onClose, title, children }) => {
  if (!open) return null;
  return (
    <div className="fixed inset-0 bg-black/50 flex items-center justify-center z-50">
      <div className="bg-white rounded-lg w-full max-w-3xl p-4">
        <div className="flex justify-between items-center mb-4">
          <h3 className="text-xl font-bold">{title}</h3>
          <Button variant="outline" onClick={onClose}>
            Close
          </Button>
        </div>
        {children}
      </div>
    </div>
  );
};

const AdminLoans = () => {
  const [loans, setLoans] = useState([]);
  const [members, setMembers] = useState([]);
  const [tab, setTab] = useState("active");
  const [page, setPage] = useState(1);
  const [totalPages, setTotalPages] = useState(1);
  const [startDate, setStartDate] = useState("");
  const [endDate, setEndDate] = useState("");
  const [loading, setLoading] = useState(false);

  const [counts, setCounts] = useState({
    active: 0,
    pending: 0,
    repaid: 0,
  });

  const [modalOpen, setModalOpen] = useState(false);
  const [modalTitle, setModalTitle] = useState("");
  const [modalLoans, setModalLoans] = useState([]);

  /* -------------------- FETCH MEMBERS -------------------- */
  const fetchMembers = async () => {
    const { data } = await supabase
      .from("userprofiles")
      .select("id, user_name")
      .order("user_name");

    setMembers(data || []);
  };

  /* -------------------- FETCH COUNTS -------------------- */
  const fetchCounts = async () => {
    const { data } = await supabase.from("loans").select("status");

    setCounts({
      active: data.filter((l) => l.status === "Active").length,
      pending: data.filter((l) => l.status === "Pending").length,
      repaid: data.filter((l) => l.status === "Repaid").length,
    });
  };

  /* -------------------- FETCH LOANS -------------------- */
  const fetchLoans = async () => {
    setLoading(true);

    let statusFilter =
      tab === "active" ? "Active" : tab === "new" ? "Pending" : "Repaid";

    let query = supabase
      .from("loans")
      .select("*", { count: "exact" })
      .eq("status", statusFilter)
      .order("application_date", { ascending: false })
      .range((page - 1) * PAGE_SIZE, page * PAGE_SIZE - 1);

    if (startDate) query = query.gte("application_date", startDate);
    if (endDate) query = query.lte("application_date", endDate);

    const { data, count } = await query;

    const enriched = data.map((loan) => {
      const member = members.find((m) => m.id === loan.member_id);
      return { ...loan, member_name: member?.user_name || "Unknown" };
    });

    setLoans(enriched);
    setTotalPages(Math.ceil((count || 0) / PAGE_SIZE));
    setLoading(false);
  };

  /* -------------------- ACTIONS -------------------- */
  const approveLoan = async (loanId) => {
    await supabase
      .from("loans")
      .update({ status: "Active", approved_date: new Date().toISOString() })
      .eq("id", loanId);

    fetchLoans();
    fetchCounts();
  };

  const declineLoan = async (loanId) => {
    await supabase
      .from("loans")
      .update({ status: "Declined" })
      .eq("id", loanId);

    fetchLoans();
    fetchCounts();
  };

  useEffect(() => {
    fetchMembers();
    fetchCounts();
  }, []);

  useEffect(() => {
    if (members.length) fetchLoans();
  }, [members, tab, page, startDate, endDate]);

  /* -------------------- GROUP ACTIVE LOANS -------------------- */
  const groupedLoans = loans.reduce((acc, loan) => {
    if (!acc[loan.member_id]) acc[loan.member_id] = [];
    acc[loan.member_id].push(loan);
    return acc;
  }, {});

  return (
    <div className="space-y-6">
      <div>
        <h2 className="text-3xl font-bold">Loans Management</h2>
        <p className="text-muted-foreground">Track all loan activities</p>
      </div>

      <Tabs value={tab} onValueChange={(v) => { setTab(v); setPage(1); }}>
        <TabsList className="grid w-full grid-cols-3">
          <TabsTrigger value="active">
            Active Loans <Badge className="ml-2 bg-green-500">{counts.active}</Badge>
          </TabsTrigger>
          <TabsTrigger value="new">
            New Applications <Badge className="ml-2 bg-yellow-500">{counts.pending}</Badge>
          </TabsTrigger>
          <TabsTrigger value="repaid">
            Repaid <Badge className="ml-2 bg-blue-500">{counts.repaid}</Badge>
          </TabsTrigger>
        </TabsList>

        <div className="flex gap-3 flex-wrap mt-2">
          <Input type="date" value={startDate} onChange={(e) => setStartDate(e.target.value)} />
          <Input type="date" value={endDate} onChange={(e) => setEndDate(e.target.value)} />
          <Button onClick={fetchLoans}>Filter</Button>
        </div>

        {/* ACTIVE LOANS → MODAL */}
        <TabsContent value="active">
          <Card className="mt-3">
            <CardContent className="space-y-4">
              {Object.keys(groupedLoans).map((memberId) => {
                const group = groupedLoans[memberId];
                return (
                  <div
                    key={memberId}
                    className="border rounded p-3 bg-gray-50 cursor-pointer"
                    onClick={() => {
                      setModalTitle(`Active Loans - ${group[0].member_name}`);
                      setModalLoans(group);
                      setModalOpen(true);
                    }}
                  >
                    <p className="font-semibold">{group[0].member_name}</p>
                    <Badge className="bg-green-600">{group.length} active</Badge>
                  </div>
                );
              })}
            </CardContent>
          </Card>
        </TabsContent>

        {/* NEW APPLICATIONS */}
        <TabsContent value="new">
          <LoanList
            loans={loans}
            loading={loading}
            approveLoan={approveLoan}
            declineLoan={declineLoan}
            showApprove
          />
        </TabsContent>

        {/* REPAID */}
        <TabsContent value="repaid">
          <LoanList loans={loans} loading={loading} />
        </TabsContent>
      </Tabs>

      {/* ACTIVE LOANS MODAL */}
      <Modal open={modalOpen} onClose={() => setModalOpen(false)} title={modalTitle}>
        <div className="space-y-4">
          {modalLoans.map((loan) => (
            <div key={loan.id} className="border-b pb-3">
              <p className="font-medium">{loan.reason}</p>
              <p className="text-sm text-muted-foreground">
                Applied: {new Date(loan.application_date).toLocaleDateString()}
              </p>
              <p className="text-sm text-muted-foreground">
                Due: {loan.due_date ? new Date(loan.due_date).toLocaleDateString() : "—"}
              </p>
              <p className="text-sm">
                Total: <span className="font-semibold">KSh {loan.total_loan.toLocaleString()}</span>
              </p>
              <p className="text-sm text-red-600">
                Remaining: KSh {loan.loan_balance.toLocaleString()}
              </p>
            </div>
          ))}
        </div>
      </Modal>
    </div>
  );
};

/* -------------------- LOAN LIST -------------------- */
const LoanList = ({ loans, loading, approveLoan, declineLoan, showApprove }) => {
  if (loading) return <p>Loading...</p>;
  if (!loans.length) return <p>No loans found.</p>;

  return (
    <Card className="mt-2">
      <CardHeader>
        <CardTitle>Loans</CardTitle>
      </CardHeader>
      <CardContent className="space-y-3">
        {loans.map((loan) => (
          <div key={loan.id} className="flex justify-between border-b pb-2">
            <div>
              <p className="font-medium">{loan.member_name}</p>
              <p className="text-sm text-muted-foreground">{loan.reason}</p>
              <p className="text-xs text-muted-foreground">
                Applied: {new Date(loan.application_date).toLocaleDateString()}
              </p>
            </div>

            <div className="flex items-center gap-3">
              <p className="font-semibold">
                KSh {loan.total_loan.toLocaleString()}
              </p>

              {showApprove && (
                <>
                  <Button size="sm" onClick={() => approveLoan(loan.id)}>
                    Approve
                  </Button>
                  <Button size="sm" variant="destructive" onClick={() => declineLoan(loan.id)}>
                    Decline
                  </Button>
                </>
              )}
            </div>
          </div>
        ))}
      </CardContent>
    </Card>
  );
};

export default AdminLoans;
