import { useState } from "react";
import { toast } from "sonner";

const AdminUserManagement = () => {
  const [name, setName] = useState("");
  const [phone, setPhone] = useState("");
  const [idNo, setIdNo] = useState("");
  const [loading, setLoading] = useState(false);

  const handleCreateUser = async () => {
    if (!name || !idNo) {
      toast.error("Name and ID number are required");
      return;
    }

    setLoading(true);

    try {
      const res = await fetch("/api/create-user", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ user_name: name, phone, id_no: idNo }),
      });

      const data = await res.json();

      if (!res.ok) throw new Error(data.error || "Failed to create user");

      toast.success("User created successfully!");
      setName("");
      setPhone("");
      setIdNo("");
    } catch (err: any) {
      console.error(err);
      toast.error(err.message || "Something went wrong");
    } finally {
      setLoading(false);
    }
  };

  return (
    <div className="p-6">
      <h2 className="text-xl font-bold mb-4">Admin User Management</h2>
      <div className="space-y-4 max-w-md">
        <input
          className="w-full p-2 border rounded"
          placeholder="Full Name"
          value={name}
          onChange={(e) => setName(e.target.value)}
        />
        <input
          className="w-full p-2 border rounded"
          placeholder="Phone (optional)"
          value={phone}
          onChange={(e) => setPhone(e.target.value)}
        />
        <input
          className="w-full p-2 border rounded"
          placeholder="ID Number"
          value={idNo}
          onChange={(e) => setIdNo(e.target.value)}
        />

        <button
          className="w-full bg-yellow-500 text-black p-2 rounded font-semibold"
          onClick={handleCreateUser}
          disabled={loading}
        >
          {loading ? "Creating..." : "Create User"}
        </button>
      </div>
    </div>
  );
};

export default AdminUserManagement;
