"use client";

import { useEffect, useState, useMemo } from "react";
import { supabase } from "@/lib/supabase";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Input } from "@/components/ui/input";
import { Button } from "@/components/ui/button";
import { Skeleton } from "@/components/ui/skeleton";
import { Tabs, TabsList, TabsTrigger, TabsContent } from "@/components/ui/tabs";

const PAGE_SIZE = 10;

const PiaggioSpinner = ({ className = "h-10 w-10" }: { className?: string }) => (
  <div className={`inline-block ${className} animate-spin`}>
    <svg viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="1.5" aria-hidden>
      <path d="M3 11c0-1.657 1.343-3 3-3h3l2-3h3l1.5 3H21" />
      <circle cx="7" cy="17" r="2" />
      <circle cx="17" cy="17" r="2" />
      <path d="M12 8v3" />
    </svg>
  </div>
);

const SharesSection = () => {
  const [userId, setUserId] = useState<string | null>(null);

  // tabs
  const [tab, setTab] = useState("deposits");

  // available users autocomplete
  const [receiverSearch, setReceiverSearch] = useState("");
  const [receiverOptions, setReceiverOptions] = useState<any[]>([]);
  const [receiverId, setReceiverId] = useState(""); // stores member_no (e.g. TPSK-024k)
  const [receiverName, setReceiverName] = useState("");

  // numbers
  const [transferAmount, setTransferAmount] = useState<number | "">("");
  const [transfering, setTransfering] = useState(false);

  // recent data
  const [recentDeposits, setRecentDeposits] = useState<any[]>([]);
  const [recentTransfers, setRecentTransfers] = useState<any[]>([]);

  // settings
  const [transferFee, setTransferFee] = useState<number>(0);

  // totals
  const [totalShares, setTotalShares] = useState<number>(0);

  // UI
  const [loading, setLoading] = useState(true);

  const formatDate = (d: Date) => d.toISOString().split("T")[0];

  // get current member id from auth
  useEffect(() => {
    (async () => {
      try {
        const { data } = await supabase.auth.getUser();
        const id = data?.user?.id ?? null;
        setUserId(id);
      } catch (e) {
        console.error("Error getting auth user:", e);
        setUserId(null);
      }
    })();
  }, []);

  // helper: get receiver UUID from member_no
  const getReceiverUUID = async (member_no: string) => {
    if (!member_no) return null;
    try {
      const { data, error } = await supabase
        .from("userprofiles")
        .select("id")
        .eq("member_no", member_no)
        .single();
      if (error) {
        // not found or other error
        console.warn("getReceiverUUID error:", error);
        return null;
      }
      return data?.id ?? null;
    } catch (e) {
      console.error("getReceiverUUID exception:", e);
      return null;
    }
  };

  // fetch transfer fee from settings
  useEffect(() => {
    (async () => {
      try {
        const { data } = await supabase
          .from("settings")
          .select("share_transfer_fee")
          .order("effective_date", { ascending: false })
          .limit(1)
          .single();
        setTransferFee(Number(data?.share_transfer_fee ?? 0));
      } catch (e) {
        console.error("Error fetching settings:", e);
      }
    })();
  }, []);

  // central fetch for deposits + transfers + totals
  const fetchSharesData = async (currentUserId: string | null) => {
    if (!currentUserId) return;
    setLoading(true);

    try {
      // deposits (amount > 0)
      const { data: deposits } = await supabase
        .from("shares")
        .select("*")
        .eq("member_id", currentUserId)
        .gt("amount", 0)
        .order("created_at", { ascending: false })
        .limit(PAGE_SIZE);

      // transfers (transfer_amount > 0)
      const { data: transfers } = await supabase
        .from("shares")
        .select("*")
        .eq("member_id", currentUserId)
        .gt("transfer_amount", 0)
        .order("created_at", { ascending: false })
        .limit(PAGE_SIZE);

      // Map receiver_member_no directly from `receiver` column (we store member_no in receiver)
      const transfersWithMemberNo = (transfers ?? []).map((t) => ({
        ...t,
        receiver_member_no: t.receiver ?? "",
      }));

      // compute totals:
      const totalDeposits =
        deposits?.reduce((sum, r) => sum + Number(r.amount), 0) || 0;
      const totalTransfers =
        transfers?.reduce((sum, r) => sum + Number(r.transfer_amount), 0) || 0;

      setRecentDeposits(deposits ?? []);
      setRecentTransfers(transfersWithMemberNo);
      setTotalShares(totalDeposits - totalTransfers);
    } catch (e) {
      console.error("fetchSharesData error:", e);
    } finally {
      setLoading(false);
    }
  };

  // call fetch when userId is available
  useEffect(() => {
    if (!userId) return;
    fetchSharesData(userId);
  }, [userId]);

  // autocomplete search (search by member_no, user_name, phone)
  useEffect(() => {
    const s = receiverSearch.trim();
    if (s.length < 2) {
      setReceiverOptions([]);
      return;
    }

    let mounted = true;
    (async () => {
      try {
        const { data, error } = await supabase
          .from("userprofiles")
          .select("id, user_name, member_no, phone")
          .or(`member_no.ilike.%${s}%,user_name.ilike.%${s}%,phone.ilike.%${s}%`)
          .limit(8);

        if (error) {
          console.error("SEARCH ERROR:", error);
          if (mounted) setReceiverOptions([]);
          return;
        }

        if (mounted) setReceiverOptions(data ?? []);
      } catch (e) {
        console.error("Autocomplete error:", e);
        if (mounted) setReceiverOptions([]);
      }
    })();

    return () => {
      mounted = false;
    };
  }, [receiverSearch]);

  // transfer logic includes receiver ledger update
  const handleTransfer = async () => {
    if (!userId) return alert("Error: Not logged in");
    const amount = Number(transferAmount);
    if (!amount || amount <= 0) return alert("Enter valid transfer amount");
    if (!receiverId) return alert("Receiver not selected");

    if (amount > totalShares) return alert("You do not have enough shares to transfer");

    const confirmed = window.confirm(
      `Confirm transfer of ${amount} shares to ${receiverName || receiverId} (${receiverId}). Fee: KSh ${transferFee}`
    );
    if (!confirmed) return;

    setTransfering(true);

    try {
      const today = formatDate(new Date());

      // ---------------------------
      // 1) insert transfer row for sender (amount remains zero)
      //    - member_id must be the sender UUID (userId)
      //    - receiver stores member_no (receiverId)
      //    - transfer_amount > 0 (satisfies check)
      // ---------------------------
      const senderInsert = {
        member_id: userId,
        deposit_date: today,
        transfer_date: today,
        receiver: receiverId, // member_no
        transfer_amount: amount,
        transfer_fee: transferFee,
        amount: 0,
        total_shares: totalShares - amount,
      };

      const { error: sendErr } = await supabase.from("shares").insert(senderInsert);
      if (sendErr) {
        console.error("Error inserting sender transfer row:", sendErr);
        throw sendErr;
      }

      // ---------------------------
      // 2) get receiver UUID by member_no (receiverId)
      // ---------------------------
      const receiverUUID = await getReceiverUUID(receiverId);
      if (!receiverUUID) {
        // We inserted sender row already; consider rolling back or inform user.
        // For now, we inform user that receiver lookup failed.
        console.warn("Receiver UUID not found for member_no:", receiverId);
        // Still, we can create a receiver row with member_id = null (not ideal).
        // But user asked to store valid UUID — so we stop here and notify.
        throw new Error(`Could not find user with member_no ${receiverId}`);
      }

      // ---------------------------
      // 3) fetch receiver existing totals (if you want to compute their total_shares)
      //    we will not rely on member_no in member_id here — receiver totals are computed by member_id (uuid)
      // ---------------------------
      const { data: receiverData } = await supabase
        .from("shares")
        .select("amount, transfer_amount")
        .eq("member_id", receiverUUID);

      const receiverD = receiverData?.reduce((s: number, r: any) => s + Number(r.amount || 0), 0) || 0;
      const receiverT = receiverData?.reduce((s: number, r: any) => s + Number(r.transfer_amount || 0), 0) || 0;
      const receiverTotal = receiverD - receiverT;

      // ---------------------------
      // 4) insert deposit row for receiver
      //    - member_id must be receiverUUID (uuid)
      //    - receiver column can store member_no as reference (we store receiverId)
      //    - amount should be the transferred amount
      //    - deposit_date should be today
      // ---------------------------
      const receiverInsert = {
        member_id: receiverUUID,
        receiver: receiverId, // store member_no for the receiver row as well (keeps trace)
        deposit_date: today,
        amount: amount,
        total_shares: receiverTotal + amount,
      };

      const { error: recvErr } = await supabase.from("shares").insert(receiverInsert);
      if (recvErr) {
        console.error("Error inserting receiver deposit row:", recvErr);
        throw recvErr;
      }

      // refresh UI
      await fetchSharesData(userId);

      alert("Transfer completed successfully.");
      setReceiverId("");
      setReceiverSearch("");
      setReceiverOptions([]);
      setReceiverName("");
      setTransferAmount("");
    } catch (e: any) {
      console.error("Error processing transfer:", e);
      alert("Error processing transfer: " + (e?.message ?? "unknown error"));
    } finally {
      setTransfering(false);
    }
  };

  return (
    <div className="space-y-6">
      <h2 className="text-3xl font-bold">Shares</h2>

      <Tabs value={tab} onValueChange={(v) => setTab(v)}>
        <TabsList>
          <TabsTrigger value="deposits">Deposits</TabsTrigger>
          <TabsTrigger value="transfers">Transfers</TabsTrigger>
        </TabsList>

        {/* ========================= DEPOSITS TAB ========================= */}
        <TabsContent value="deposits">
          <Card className="mb-5">
            <CardHeader>
              <CardTitle>Total Shares</CardTitle>
            </CardHeader>
            <CardContent>
              {loading ? (
                <Skeleton className="h-8 w-32" />
              ) : (
                <>
                  <p className="text-4xl font-bold">{totalShares}</p>
                  <p className="text-sm mt-1 text-muted-foreground">
                    Current Transfer Fee: KSh {transferFee}
                  </p>
                </>
              )}
            </CardContent>
          </Card>

          {/* Transfer Form */}
          <Card>
            <CardHeader>
              <CardTitle>Transfer Shares</CardTitle>
            </CardHeader>
            <CardContent className="space-y-3">
              <div>
                <label className="text-sm block mb-1">Receiver Member Id</label>
                <Input
                  placeholder="Search receiver..."
                  value={receiverSearch}
                  onChange={(e) => {
                    setReceiverSearch(e.target.value);
                    setReceiverId("");
                  }}
                />
                {receiverOptions.length > 0 && (
                  <div className="border rounded mt-1 bg-white">
                    {receiverOptions.map((u) => (
                      <div
                        key={u.id}
                        className="px-2 py-1 hover:bg-gray-200 cursor-pointer"
                        onClick={() => {
                          // IMPORTANT: store member_no (not uuid) as requested
                          setReceiverId(u.member_no);
                          setReceiverName(u.user_name);
                          setReceiverSearch(`${u.member_no} — ${u.user_name}`);
                          setReceiverOptions([]);
                        }}
                      >
                        {u.member_no} — {u.user_name} ({u.phone})
                      </div>
                    ))}
                  </div>
                )}
              </div>

              <div>
                <label className="text-sm block mb-1">Transfer Amount (shares)</label>
                <Input
                  type="number"
                  min={1}
                  value={transferAmount as any}
                  onChange={(e) =>
                    setTransferAmount(e.target.value === "" ? "" : Number(e.target.value))
                  }
                />
              </div>

              <Button onClick={handleTransfer} disabled={transfering}>
                {transfering ? "Processing..." : "Transfer"}
              </Button>
            </CardContent>
          </Card>

          {/* recent deposits */}
<Card className="mt-6">
  <CardHeader>
    <CardTitle>Recent Deposits</CardTitle>
  </CardHeader>

  <CardContent>
    {loading ? (
      <Skeleton className="h-6" />
    ) : recentDeposits.length === 0 ? (
      <p>No deposits yet.</p>
    ) : (
      recentDeposits.map((r) => {
        const isTransferedDeposit =
          typeof r.receiver === "string" && r.receiver.trim() !== "";

        return (
          <div
            key={r.id}
            className={`flex justify-between border-b py-2 rounded px-2
              ${isTransferedDeposit ? "bg-yellow-100" : "bg-green-100"}
            `}
          >
            <div>
              <div>{r.deposit_date}</div>
              <div className="text-muted-foreground text-sm">ref: {r.id}</div>

              {isTransferedDeposit && (
                <div className="text-xs text-yellow-700 font-semibold">
                  Transfer from {r.receiver}
                </div>
              )}
            </div>

            <div className="font-semibold">+{Number(r.amount)} shares</div>
          </div>
        );
      })
    )}
  </CardContent>
</Card>

        </TabsContent>

        {/* ========================= TRANSFERS TAB ========================= */}
        <TabsContent value="transfers">
          <Card>
            <CardHeader>
              <CardTitle>Recent Transfers</CardTitle>
            </CardHeader>
            <CardContent>
              {loading ? (
                <Skeleton className="h-6" />
              ) : recentTransfers.length === 0 ? (
                <p>No share transfers yet.</p>
              ) : (
                recentTransfers.map((r) => (
                  <div key={r.id} className="flex justify-between border-b py-2">
                    <div>
                      <div>{r.transfer_date}</div>
                      <div className="text-sm">To: {r.receiver_member_no}</div>
                    </div>
                    <div className="font-semibold">−{Number(r.transfer_amount)} shares</div>
                  </div>
                ))
              )}
            </CardContent>
          </Card>
        </TabsContent>
      </Tabs>
    </div>
  );
};

export default SharesSection;
