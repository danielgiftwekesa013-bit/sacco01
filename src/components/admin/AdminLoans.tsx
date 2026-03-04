import { useState, useEffect } from "react";
import { supabase } from "@/lib/supabase";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Badge } from "@/components/ui/badge";
import { Tabs, TabsContent, TabsList, TabsTrigger } from "@/components/ui/tabs";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";

const PAGE_SIZE = 10;

const AdminLoans = () => {
  const [loans, setLoans] = useState([]);
  const [members, setMembers] = useState([]);
  const [tab, setTab] = useState("active");
  const [page, setPage] = useState(1);
  const [totalPages, setTotalPages] = useState(1);
  const [loading, setLoading] = useState(false);
  const [counts, setCounts] = useState({ active: 0, pending: 0, repaid: 0 });

  const [showCreate, setShowCreate] = useState(false);
  const [expandedLoan, setExpandedLoan] = useState(null);

  const [memberNo, setMemberNo] = useState("");
  const [loanAmount, setLoanAmount] = useState("");
  const [loanPeriod, setLoanPeriod] = useState("");
  const [loanReason, setLoanReason] = useState("");
  const [calculations, setCalculations] = useState({
    rate: 0,
    interest: 0,
    total: 0,
    dueDate: "",
  });

  /* ---------------- FETCH MEMBERS ---------------- */
  const fetchMembers = async () => {
    const { data } = await supabase
      .from("userprofiles")
      .select("id, user_name, member_no");

    setMembers(data || []);
  };

  /* ---------------- FETCH COUNTS ---------------- */
  const fetchCounts = async () => {
    const { data } = await supabase.from("loans").select("status");

    setCounts({
      active: data?.filter((l) => l.status === "Active").length || 0,
      pending: data?.filter((l) => l.status === "Pending").length || 0,
      repaid: data?.filter((l) => l.status === "Repaid").length || 0,
    });
  };

  /* ---------------- FETCH LOANS ---------------- */
  const fetchLoans = async () => {
    setLoading(true);

    const statusMap = {
      active: "Active",
      new: "Pending",
      repaid: "Repaid",
    };

    const { data, count } = await supabase
      .from("loans")
      .select("*", { count: "exact" })
      .eq("status", statusMap[tab])
      .order("application_date", { ascending: false })
      .range((page - 1) * PAGE_SIZE, page * PAGE_SIZE - 1);

    const enriched = (data || []).map((loan) => {
      const member = members.find((m) => m.id === loan.member_id);
      return { ...loan, member_name: member?.user_name || "Unknown" };
    });

    setLoans(enriched);
    setTotalPages(Math.ceil((count || 0) / PAGE_SIZE));
    setLoading(false);
  };

  /* ---------------- AUTO CALCULATE ---------------- */
  useEffect(() => {
  if (!loanAmount || !loanPeriod) {
    setCalculations({ rate: 0, interest: 0, total: 0, dueDate: "" });
    return;
  }

  const p = Number(loanAmount);
  const t = Number(loanPeriod);

  if (t <= 0 || t > 36) return;

  // 🔥 SHAA SPECIAL RULE
  const isShaa = loanReason?.trim().toLowerCase() === "shaa";

  const rate = isShaa
    ? 10 // Always 10% for SHAA
    : t <= 3
    ? 10
    : 15;

  const interest = Number(((p * rate * (t / 12)) / 100).toFixed(2));
  const total = Number((p + interest).toFixed(2));

  const due = new Date();
  due.setMonth(due.getMonth() + t);

  setCalculations({
    rate,
    interest,
    total,
    dueDate: due.toISOString().split("T")[0],
  });
}, [loanAmount, loanPeriod, loanReason]); // 🔥 add loanReason here

  /* ---------------- CREATE LOAN ---------------- */
  const applyLoanAsAdmin = async () => {
    if (!memberNo || !loanAmount || !loanPeriod || !loanReason) {
      alert("Fill all fields");
      return;
    }

    const { data: member } = await supabase
      .from("userprofiles")
      .select("id")
      .eq("member_no", memberNo)
      .single();

    if (!member) {
      alert("Member not found");
      return;
    }

    const totalLoan = calculations.total;
     // 🔥 SHAA auto approval
const isShaa = loanReason?.trim().toLowerCase() === "shaa";
    const { error } = await supabase.from("loans").insert({
      member_id: member.id,
      principle: Number(Number(loanAmount).toFixed(2)),
      interest: calculations.interest,
      rate: calculations.rate,
      time: Number(loanPeriod),
      due_date: calculations.dueDate,
      reason: loanReason,
    
     


status: isShaa ? "Active" : "Pending",
    });

    if (error) {
      alert(error.message);
      return;
    }

    alert("Loan Created Successfully");

    setShowCreate(false);
    setMemberNo("");
    setLoanAmount("");
    setLoanPeriod("");
    setLoanReason("");

    fetchLoans();
    fetchCounts();
  };

  /* ---------------- APPROVE / DECLINE ---------------- */
  const approveLoan = async (loanId) => {
    await supabase
      .from("loans")
      .update({ status: "Active", approved_date: new Date() })
      .eq("id", loanId);

    fetchLoans();
    fetchCounts();
  };

  const declineLoan = async (loanId) => {
    await supabase.from("loans").update({ status: "Declined" }).eq("id", loanId);
    fetchLoans();
    fetchCounts();
  };

  useEffect(() => {
    fetchMembers();
    fetchCounts();
  }, []);

  useEffect(() => {
    if (members.length) fetchLoans();
  }, [members, tab, page]);

  return (
    <div className="space-y-6">
      <div className="flex justify-between items-center">
        <div>
          <h2 className="text-3xl font-bold">Loans Management</h2>
          <p className="text-muted-foreground">Track all loan activities</p>
        </div>

        <Button onClick={() => setShowCreate(!showCreate)}>
          {showCreate ? "Close" : "+ Create Loan"}
        </Button>
      </div>

      {showCreate && (
        <Card>
          <CardHeader>
            <CardTitle>Create Loan Application</CardTitle>
          </CardHeader>
          <CardContent className="space-y-4">
            <Input placeholder="Member Number" value={memberNo} onChange={(e) => setMemberNo(e.target.value)} />
            <Input type="number" placeholder="Loan Amount" value={loanAmount} onChange={(e) => setLoanAmount(e.target.value)} />
            <Input type="number" placeholder="Loan Period (Months)" value={loanPeriod} onChange={(e) => setLoanPeriod(e.target.value)} />
            <Input placeholder="Reason" value={loanReason} onChange={(e) => setLoanReason(e.target.value)} />

            {calculations.total > 0 && (
              <div className="p-3 bg-gray-100 rounded text-sm">
                <p>Interest Rate: {calculations.rate}%</p>
                <p>Total Loan: KSh {calculations.total.toFixed(2)}</p>
                <p>Due Date: {calculations.dueDate}</p>
              </div>
            )}

            <Button onClick={applyLoanAsAdmin}>Create Loan</Button>
          </CardContent>
        </Card>
      )}

      <Tabs value={tab} onValueChange={(v) => { setTab(v); setPage(1); }}>
        <TabsList className="grid w-full grid-cols-3">
          <TabsTrigger value="active">
            Active <Badge className="ml-2 bg-green-500">{counts.active}</Badge>
          </TabsTrigger>
          <TabsTrigger value="new">
            New <Badge className="ml-2 bg-yellow-500">{counts.pending}</Badge>
          </TabsTrigger>
          <TabsTrigger value="repaid">
            Repaid <Badge className="ml-2 bg-blue-500">{counts.repaid}</Badge>
          </TabsTrigger>
        </TabsList>

        <TabsContent value={tab}>
          <Card className="mt-4">
            <CardContent className="space-y-3">
              {loans.map((loan) => (
                <div key={loan.id} className="border rounded p-3">
                  <div
                    className="flex justify-between cursor-pointer"
                    onClick={() =>
                      setExpandedLoan(expandedLoan === loan.id ? null : loan.id)
                    }
                  >
                    <div>
                      <p className="font-medium">{loan.member_name}</p>
                      <p className="text-sm">{loan.reason}</p>
                    </div>
                    <p className="font-semibold">
                      KSh {Number(loan.total_loan || 0).toFixed(2)}
                    </p>
                  </div>

                  {expandedLoan === loan.id && (
                    <div className="mt-3 text-sm space-y-1 bg-gray-50 p-3 rounded">
                      <p>Total Loan: KSh {Number(loan.total_loan).toFixed(2)}</p>
                      <p>Paid Amount: KSh {Number(loan.paid_amount).toFixed(2)}</p>
                      <p>Remaining: KSh {Number(loan.loan_balance).toFixed(2)}</p>
                      <p>Due Date: {loan.due_date}</p>

                      {tab === "new" && (
                        <div className="flex gap-2 mt-2">
                          <Button size="sm" onClick={() => approveLoan(loan.id)}>Approve</Button>
                          <Button size="sm" variant="destructive" onClick={() => declineLoan(loan.id)}>Decline</Button>
                        </div>
                      )}
                    </div>
                  )}
                </div>
              ))}
            </CardContent>
          </Card>

          {totalPages > 1 && (
            <div className="flex justify-center gap-3 mt-4">
              <Button disabled={page === 1} onClick={() => setPage(page - 1)}>Previous</Button>
              <span>Page {page} of {totalPages}</span>
              <Button disabled={page === totalPages} onClick={() => setPage(page + 1)}>Next</Button>
            </div>
          )}
        </TabsContent>
      </Tabs>
    </div>
  );
};

export default AdminLoans;