"use client";

import { useEffect, useState } from "react";
import { supabase } from "@/lib/supabase";

import {
  Card,
  CardContent,
  CardHeader,
  CardTitle,
} from "@/components/ui/card";
import { Input } from "@/components/ui/input";
import { Button } from "@/components/ui/button";
import { useToast } from "@/components/ui/use-toast";

const AdminDeductions = () => {
  const { toast } = useToast();

  /* ================= SETTINGS ================= */
  const [currentSettings, setCurrentSettings] = useState<any>(null);
  const [fineFee, setFineFee] = useState("");
  const [transferFee, setTransferFee] = useState("");
  const [loading, setLoading] = useState(false);

  /* ================= FETCH LATEST SETTINGS ================= */
  const fetchLatestSettings = async () => {
    const { data, error } = await supabase
      .from("settings")
      .select("*")
      .order("created_at", { ascending: false })
      .limit(1)
      .single();

    if (!error && data) {
      setCurrentSettings(data);
    }
  };

  useEffect(() => {
    fetchLatestSettings();
  }, []);

  /* ================= UPDATE SETTINGS ================= */
  const saveSettings = async () => {
    if (!currentSettings?.id) {
      toast({
        title: "Error",
        description: "No settings record found.",
        variant: "destructive",
      });
      return;
    }

    if (!fineFee && !transferFee) {
      toast({
        title: "Nothing to update",
        description: "Enter at least one value",
        variant: "destructive",
      });
      return;
    }

    setLoading(true);

    // Build dynamic update object
    const updateData: any = {};

    if (fineFee !== "") {
      updateData.fine_fee = Number(fineFee);
    }

    if (transferFee !== "") {
      updateData.share_transfer_fee = Number(transferFee);
    }

    const { error } = await supabase
      .from("settings")
      .update(updateData)
      .eq("id", currentSettings.id);

    setLoading(false);

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
      description: "Settings updated successfully",
    });

    setFineFee("");
    setTransferFee("");
    fetchLatestSettings();
  };

  return (
    <div className="space-y-6">
      <h1 className="text-3xl font-bold">Deductions Management</h1>

      <Card>
        <CardHeader>
          <CardTitle>System Settings</CardTitle>
        </CardHeader>

        <CardContent className="space-y-4">
          {currentSettings && (
            <div className="text-sm text-muted-foreground space-y-1">
              <p>Current Fine Fee: KSh {currentSettings.fine_fee ?? 0}</p>
              <p>
                Current Transfer Fee: KSh{" "}
                {currentSettings.share_transfer_fee ?? 0}
              </p>
            </div>
          )}

          <Input
            type="number"
            placeholder="Update Fine Fee"
            value={fineFee}
            onChange={(e) => setFineFee(e.target.value)}
          />

          <Input
            type="number"
            placeholder="Update Transfer Fee"
            value={transferFee}
            onChange={(e) => setTransferFee(e.target.value)}
          />

          <Button onClick={saveSettings} disabled={loading}>
            {loading ? "Updating..." : "Update Settings"}
          </Button>
        </CardContent>
      </Card>
    </div>
  );
};

export default AdminDeductions;