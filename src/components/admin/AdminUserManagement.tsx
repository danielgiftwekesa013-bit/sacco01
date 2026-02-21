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
      // Use absolute URL based on environment
      const baseUrl = import.meta.env.VITE_BACKEND_URL || "";
      const res = await fetch(`${baseUrl}/api/create-user`, {
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
      console.error("Create user failed:", err);
      toast.error(err.message || "Something went wrong");
    } finally {
      setLoading(false);
    }
  };

  return (
    <div className="p-6 max-w-2xl mx-auto">
      <h2 className="text-2xl font-bold mb-6 text-center md:text-left">
        Admin User Management
      </h2>

      <div className="bg-white shadow-md rounded-lg p-6 space-y-4">
        <input
          className="w-full p-3 border border-gray-300 rounded focus:outline-none focus:ring-2 focus:ring-yellow-400"
          placeholder="Full Name"
          value={name}
          onChange={(e) => setName(e.target.value)}
        />
        <input
          className="w-full p-3 border border-gray-300 rounded focus:outline-none focus:ring-2 focus:ring-yellow-400"
          placeholder="Phone (optional)"
          value={phone}
          onChange={(e) => setPhone(e.target.value)}
        />
        <input
          className="w-full p-3 border border-gray-300 rounded focus:outline-none focus:ring-2 focus:ring-yellow-400"
          placeholder="ID Number"
          value={idNo}
          onChange={(e) => setIdNo(e.target.value)}
        />

        <button
          className={`w-full bg-yellow-500 text-black p-3 rounded font-semibold transition hover:bg-yellow-600 ${
            loading ? "opacity-70 cursor-not-allowed" : ""
          }`}
          onClick={handleCreateUser}
          disabled={loading}
        >
          {loading ? "Registering..." : "Register Member"}
        </button>
      </div>
    </div>
  );
};

export default AdminUserManagement;
