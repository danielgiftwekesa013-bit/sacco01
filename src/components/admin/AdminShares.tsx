import { useEffect, useState } from "react";
import { supabase } from "@/lib/supabase";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Button } from "@/components/ui/button";

/* -------------------- Modal Component -------------------- */
const Modal = ({ open, onClose, title, children }) => {
  if (!open) return null;
  return (
    <div className="fixed inset-0 bg-black/50 flex items-center justify-center z-50">
      <div className="bg-white rounded-lg w-full max-w-3xl p-4">
        <div className="flex justify-between items-center mb-4">
          <h3 className="text-xl font-bold">{title}</h3>
          <Button variant="outline" onClick={onClose}>Close</Button>
        </div>
        {children}
      </div>
    </div>
  );
};

const PAGE_SIZE = 5;

const AdminShares = () => {
  const [members, setMembers] = useState([]);
  const [holders, setHolders] = useState([]);
  const [transfers, setTransfers] = useState([]);
  const [tab, setTab] = useState("holders");

  const [selectedMember, setSelectedMember] = useState(null);
  const [details, setDetails] = useState([]);
  const [page, setPage] = useState(1);
  const [modalOpen, setModalOpen] = useState(false);
  const [modalTitle, setModalTitle] = useState("");

  /* -------------------- Fetch Members -------------------- */
  const fetchMembers = async () => {
    const { data } = await supabase
      .from("userprofiles")
      .select("id, user_name, member_no");
    setMembers(data || []);
  };

  /* -------------------- Share Holders (Latest total_shares) -------------------- */
  const fetchHolders = async () => {
    const { data } = await supabase
      .from("shares")
      .select("member_id, total_shares, created_at")
      .order("created_at", { ascending: false });

    const latestByMember = {};
    data.forEach((row) => {
      if (!latestByMember[row.member_id]) {
        latestByMember[row.member_id] = row;
      }
    });

    const result = Object.values(latestByMember).map((r) => {
      const m = members.find((x) => x.id === r.member_id);
      return {
        member_id: r.member_id,
        member_name: m?.user_name || "Unknown",
        total_shares: Number(r.total_shares || 0),
      };
    });

    setHolders(result);
  };

  /* -------------------- Share Transfers (Grouped) -------------------- */
  const fetchTransfers = async () => {
    const { data } = await supabase
      .from("shares")
      .select("member_id, transfer_amount")
      .not("transfer_amount", "is", null);

    const grouped = {};
    data.forEach((t) => {
      grouped[t.member_id] =
        (grouped[t.member_id] || 0) + Number(t.transfer_amount);
    });

    const result = Object.entries(grouped).map(([member_id, total]) => {
      const m = members.find((x) => x.id === member_id);
      return {
        member_id,
        member_name: m?.user_name || "Unknown",
        total_transfer: total,
      };
    });

    setTransfers(result);
  };

  /* -------------------- Holder Details Modal -------------------- */
const openHolderDetails = async (holder) => {
  setModalTitle(`Share Deposit History - ${holder.member_name}`);
  setPage(1);

  const { data, error } = await supabase
    .from("shares")
    .select("amount, deposit_date, created_at")
    .eq("member_id", holder.member_id)
    .is("transfer_amount", null) // ✅ deposits only
    .order("created_at", { ascending: false });

  if (error) {
    console.error(error);
    setDetails([]);
  } else {
    setDetails(data || []);
  }

  setModalOpen(true);
};


  /* -------------------- Transfer Details Modal -------------------- */
const openTransferDetails = async (transfer) => {
  setModalTitle(`Transfer History - ${transfer.member_name}`);
  setPage(1);

  const { data, error } = await supabase
    .from("shares")
    .select(
      "member_id, receiver, transfer_amount, transfer_fee, transfer_date, total_shares"
    )
    .eq("member_id", transfer.member_id)
    .not("transfer_amount", "is", null)
    .order("transfer_date", { ascending: false });

  if (error) {
    console.error(error);
    setDetails([]);
    return;
  }

  const enriched = data.map((t) => {
    const from = members.find((m) => m.id === t.member_id);
    const to = members.find((m) => m.member_no === t.receiver);
    return {
      ...t,
      from_name: from?.user_name || "Unknown",
      to_name: to?.user_name || "Unknown",
    };
  });

  setDetails(enriched);
  setModalOpen(true);
};


  /* -------------------- Pagination -------------------- */
  const paginated = details.slice(
    (page - 1) * PAGE_SIZE,
    page * PAGE_SIZE
  );

  const totalPages = Math.ceil(details.length / PAGE_SIZE);

  /* -------------------- Grand Total Shares -------------------- */
  const grandTotalShares = holders.reduce(
    (sum, h) => sum + h.total_shares,
    0
  );

  /* -------------------- Effects -------------------- */
  useEffect(() => {
    fetchMembers();
  }, []);

  useEffect(() => {
    if (members.length) {
      fetchHolders();
      fetchTransfers();
    }
  }, [members]);

  return (
    <div className="space-y-6">
      <h2 className="text-3xl font-bold">Shares Management</h2>

      <div className="flex gap-3">
        <Button onClick={() => setTab("holders")} variant={tab === "holders" ? "default" : "outline"}>
          Shareholders
        </Button>
        <Button onClick={() => setTab("transfers")} variant={tab === "transfers" ? "default" : "outline"}>
          Transfers
        </Button>
      </div>

      {/* -------------------- SHAREHOLDERS -------------------- */}
      {tab === "holders" && (
        <Card>
          <CardHeader>
            <CardTitle>Grand Total Shares: {grandTotalShares}</CardTitle>
          </CardHeader>
          <CardContent className="space-y-3">
            {holders.map((h) => (
              <div key={h.member_id} className="flex justify-between border-b py-2">
                <div>
                  <p className="font-semibold">{h.member_name}</p>
                  <p className="text-sm text-muted-foreground">
                    Total Shares: {h.total_shares}
                  </p>
                </div>
                <Button size="sm" onClick={() => openHolderDetails(h)}>
                  View Details
                </Button>
              </div>
            ))}
          </CardContent>
        </Card>
      )}

      {/* -------------------- TRANSFERS -------------------- */}
      {tab === "transfers" && (
        <Card>
          <CardHeader>
            <CardTitle>Share Transfers</CardTitle>
          </CardHeader>
          <CardContent className="space-y-3">
            {transfers.map((t) => (
              <div key={t.member_id} className="flex justify-between border-b py-2">
                <div>
                  <p className="font-semibold">{t.member_name}</p>
                  <p className="text-sm text-muted-foreground">
                    Total Transferred: {t.total_transfer}
                  </p>
                </div>
                <Button size="sm" onClick={() => openTransferDetails(t)}>
                  View Details
                </Button>
              </div>
            ))}
          </CardContent>
        </Card>
      )}

      {/* -------------------- MODAL -------------------- */}
      <Modal open={modalOpen} onClose={() => setModalOpen(false)} title={modalTitle}>
        <div className="space-y-2">
          {paginated.map((d, i) => (
            <div key={i} className="border-b py-2 text-sm">
              {"from_name" in d ? (
                <>
                <p>Date: {d.transfer_date}</p>
                  <p>From: {d.from_name}</p>
                  <p>To: {d.to_name}</p>
                  <p>Amount: {d.transfer_amount}</p>
                  <p>Fee: {d.transfer_fee}</p>

                  <p>Balance: {d.total_shares}</p>

                  
                  
                </>
              ) : (
                <>
                  <p>Amount: {d.amount}</p>
                  
                </>
              )}
            </div>
          ))}
        </div>

        <div className="flex justify-between mt-4">
          <Button
            size="sm"
            disabled={page === 1}
            onClick={() => setPage((p) => p - 1)}
          >
            Previous
          </Button>
          <p className="text-sm">
            Page {page} of {totalPages}
          </p>
          <Button
            size="sm"
            disabled={page === totalPages}
            onClick={() => setPage((p) => p + 1)}
          >
            Next
          </Button>
        </div>
      </Modal>
    </div>
  );
};

export default AdminShares;
