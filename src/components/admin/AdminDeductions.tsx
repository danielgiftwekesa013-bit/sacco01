"use client";

import { useEffect, useState } from "react";
import { supabase } from "@/lib/supabase";

import {
  Card,
  CardContent,
  CardHeader,
  CardTitle,
} from "@/components/ui/card";
import {
  Tabs,
  TabsContent,
  TabsList,
  TabsTrigger,
} from "@/components/ui/tabs";
import { Input } from "@/components/ui/input";
import { Button } from "@/components/ui/button";
import { Checkbox } from "@/components/ui/checkbox";
import { useToast } from "@/components/ui/use-toast";

const AdminDeductions = () => {
  const { toast } = useToast();

  /* ================= SETTINGS ================= */
  const [currentSettings, setCurrentSettings] = useState<any>(null);
  const [shaaFee, setShaaFee] = useState("");
  const [fineFee, setFineFee] = useState("");
  const [transferFee, setTransferFee] = useState("");

  /* ================= MEMBERS ================= */
  const [members, setMembers] = useState<any[]>([]);
  const [applyAll, setApplyAll] = useState(false);
  const [selectedMembers, setSelectedMembers] = useState<string[]>([]);
  const [loadingApply, setLoadingApply] = useState(false);

  /* ================= FETCH LATEST SETTINGS ================= */
  const fetchLatestSettings = async () => {
    const { data, error } = await supabase
      .from("settings")
      .select("*")
      .order("created_at", { ascending: false })
      .limit(1);

    if (!error && data?.length) {
      setCurrentSettings(data[0]);
    }
  };

  /* ================= FETCH MEMBERS ================= */
  const fetchMembers = async () => {
    const { data } = await supabase
      .from("userprofiles")
      .select("id, user_name")
      .order("user_name");

    setMembers(data || []);
  };

  useEffect(() => {
    fetchLatestSettings();
    fetchMembers();
  }, []);

  /* ================= SAVE SETTINGS ================= */
  const saveSettings = async () => {
    if (!shaaFee && !fineFee && !transferFee) {
      toast({
        title: "Nothing to save",
        description: "Enter at least one value",
        variant: "destructive",
      });
      return;
    }

    const { error } = await supabase.from("settings").insert({
      shaa_fee: Number(shaaFee) || 0,
      fine_fee: Number(fineFee) || 0,
      share_transfer_fee: Number(transferFee) || 0,
    });

    if (error) {
      toast({
        title: "Error",
        description: error.message,
        variant: "destructive",
      });
      return;
    }

    toast({
      title: "Success",
      description: "Settings saved successfully",
    });

    setShaaFee("");
    setFineFee("");
    setTransferFee("");
    fetchLatestSettings();
  };

  /* ================= APPLY SHAA ================= */
  const applyShaaFee = async () => {
    if (!currentSettings?.shaa_fee) {
      toast({
        title: "Error",
        description: "No SHAA fee found in settings",
        variant: "destructive",
      });
      return;
    }

    const targetMembers = applyAll
      ? members.map((m) => m.id)
      : selectedMembers;

    if (!targetMembers.length) {
      toast({
        title: "Error",
        description: "No members selected",
        variant: "destructive",
      });
      return;
    }

    const confirmed = window.confirm(
      `Apply SHAA fee (KSh ${currentSettings.shaa_fee}) to ${targetMembers.length} member(s)?`
    );

    if (!confirmed) return;

    setLoadingApply(true);

    const today = new Date().toISOString().split("T")[0];

    const payload = targetMembers.map((memberId) => ({
      member_id: memberId,
      shaa_fee: currentSettings.shaa_fee,
      date: today,
    }));

    const { error } = await supabase.from("deductions").insert(payload);

    setLoadingApply(false);

    if (error) {
      toast({
        title: "Error",
        description: error.message,
        variant: "destructive",
      });
      return;
    }

    toast({
      title: "Success",
      description: "SHAA fee applied successfully",
    });

    setSelectedMembers([]);
    setApplyAll(false);
  };

  return (
    <div className="space-y-6">
      <h1 className="text-3xl font-bold">Deductions Management</h1>

      <Tabs defaultValue="settings">
        <TabsList className="grid grid-cols-2 w-full">
          <TabsTrigger value="settings">Settings</TabsTrigger>
          <TabsTrigger value="apply">Apply SHAA</TabsTrigger>
        </TabsList>

        {/* ================= SETTINGS ================= */}
        <TabsContent value="settings">
          <Card>
            <CardHeader>
              <CardTitle>System Settings</CardTitle>
            </CardHeader>
            <CardContent className="space-y-4">
              {currentSettings && (
                <div className="text-sm text-muted-foreground space-y-1">
                  <p>Current SHAA Fee: KSh {currentSettings.shaa_fee}</p>
                  <p>Current Fine Fee: KSh {currentSettings.fine_fee}</p>
                  <p>Current Transfer Fee: KSh {currentSettings.share_transfer_fee}</p>
                </div>
              )}

              <Input
                type="number"
                placeholder="SHAA Fee"
                value={shaaFee}
                onChange={(e) => setShaaFee(e.target.value)}
              />
              <Input
                type="number"
                placeholder="Fine Fee"
                value={fineFee}
                onChange={(e) => setFineFee(e.target.value)}
              />
              <Input
                type="number"
                placeholder="Transfer Fee"
                value={transferFee}
                onChange={(e) => setTransferFee(e.target.value)}
              />

              <Button onClick={saveSettings}>Save Settings</Button>
            </CardContent>
          </Card>
        </TabsContent>

        {/* ================= APPLY SHAA ================= */}
        <TabsContent value="apply">
          <Card>
            <CardHeader>
              <CardTitle>Apply SHAA Fee</CardTitle>
            </CardHeader>
            <CardContent className="space-y-4">
              <p className="text-sm text-muted-foreground">
                Latest SHAA Fee: <b>KSh {currentSettings?.shaa_fee ?? 0}</b>
              </p>

              <div className="flex items-center gap-2">
                <Checkbox
                  checked={applyAll}
                  onCheckedChange={() => {
                    setApplyAll(!applyAll);
                    setSelectedMembers([]);
                  }}
                />
                <span>Apply to all members</span>
              </div>

              {!applyAll && (
                <div className="max-h-64 overflow-y-auto space-y-2 border rounded p-2">
                  {members.map((m) => (
                    <div key={m.id} className="flex items-center gap-2">
                      <Checkbox
                        checked={selectedMembers.includes(m.id)}
                        onCheckedChange={() =>
                          setSelectedMembers((prev) =>
                            prev.includes(m.id)
                              ? prev.filter((id) => id !== m.id)
                              : [...prev, m.id]
                          )
                        }
                      />
                      <span>{m.user_name}</span>
                    </div>
                  ))}
                </div>
              )}

              <Button disabled={loadingApply} onClick={applyShaaFee}>
                {loadingApply ? "Applying..." : "Apply SHAA Fee"}
              </Button>
            </CardContent>
          </Card>
        </TabsContent>
      </Tabs>
    </div>
  );
};

export default AdminDeductions;
