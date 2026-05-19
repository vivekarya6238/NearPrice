import { useState, useEffect } from "react";
import { useNavigate } from "react-router-dom";
import { useAuth } from "../context/AuthContext";
import api from "../utils/api";
import {
    BarChart, Bar, XAxis, YAxis, Tooltip, ResponsiveContainer, Cell
} from "recharts";
import Navbar from "../components/Navbar";

const AdminDashboard = () => {
    const { logout } = useAuth();
    const navigate = useNavigate();
    const [stats, setStats] = useState(null);
    const [vendors, setVendors] = useState([]);
    const [users, setUsers] = useState([]);
    const [products, setProducts] = useState([]);
    const [reported, setReported] = useState([]);
    const [msg, setMsg] = useState("");
    const [activeTab, setActiveTab] = useState("vendors");
    const [selectedVendor, setSelectedVendor] = useState(null);
    const [vendorActivity, setVendorActivity] = useState(null);
    const [vendorSearch, setVendorSearch] = useState("");
    const [userSearch, setUserSearch] = useState("");
    const [overrideInputs, setOverrideInputs] = useState({});
    const [confirm, setConfirm] = useState({ show: false, msg: "", onConfirm: null });

    const fetchData = () => {
        api.get("/admin/stats").then((res) => setStats(res.data));
        api.get("/admin/vendors").then((res) => setVendors(res.data));
        api.get("/admin/users").then((res) => setUsers(res.data));
        api.get("/admin/products").then((res) => setProducts(res.data));
        api.get("/admin/reported-products").then((res) => setReported(res.data));
    };

    useEffect(() => { fetchData(); }, []);

    const showMsg = (text) => {
        setMsg(text);
        setTimeout(() => setMsg(""), 3000);
    };

    const askConfirm = (msg, onConfirm) => {
        setConfirm({ show: true, msg, onConfirm });
    };

    const handleConfirm = () => {
        confirm.onConfirm();
        setConfirm({ show: false, msg: "", onConfirm: null });
    };

    const handleCancel = () => {
        setConfirm({ show: false, msg: "", onConfirm: null });
    };

    const viewVendorActivity = async (vendor) => {
        try {
            const res = await api.get(`/admin/vendor-activity/${vendor._id}`);
            setVendorActivity(res.data);
            setSelectedVendor(vendor);
        } catch { showMsg("Failed to load activity"); }
    };

    const closeModal = () => {
        setSelectedVendor(null);
        setVendorActivity(null);
    };

    const verifyVendor = async (id) => {
        try {
            await api.put(`/admin/verify-vendor/${id}`);
            showMsg("Vendor verified!"); fetchData();
        } catch { showMsg("Failed"); }
    };

    const unverifyVendor = async (id) => {
        try {
            await api.put(`/admin/unverify-vendor/${id}`);
            showMsg("Vendor unverified!"); fetchData();
        } catch { showMsg("Failed"); }
    };

    const banVendor = async (id) => {
        try {
            await api.put(`/admin/ban-vendor/${id}`);
            showMsg("Vendor banned!"); fetchData();
        } catch { showMsg("Failed"); }
    };

    const unbanVendor = async (id) => {
        try {
            await api.put(`/admin/unban-vendor/${id}`);
            showMsg("Vendor unbanned!"); fetchData();
        } catch { showMsg("Failed"); }
    };

    const banUser = async (id) => {
        try {
            await api.put(`/admin/ban-user/${id}`);
            showMsg("User banned!"); fetchData();
        } catch { showMsg("Failed"); }
    };

    const unbanUser = async (id) => {
        try {
            await api.put(`/admin/unban-user/${id}`);
            showMsg("User unbanned!"); fetchData();
        } catch { showMsg("Failed"); }
    };

    const deleteProduct = async (id) => {
        try {
            await api.delete(`/admin/product/${id}`);
            showMsg("Product deleted!"); fetchData();
        } catch { showMsg("Failed"); }
    };

    const overridePrice = async (id) => {
        try {
            await api.put(`/admin/product-price/${id}`, {
                currentPrice: parseFloat(overrideInputs[id]),
            });
            showMsg("Price overridden!");
            setOverrideInputs({ ...overrideInputs, [id]: "" });
            fetchData();
        } catch { showMsg("Failed to override price"); }
    };

    const promoteToAdmin = async (id) => {
        try {
            await api.put(`/admin/promote/${id}`);
            showMsg("User promoted to Admin!"); fetchData();
        } catch { showMsg("Failed to promote"); }
    };

    const demoteToUser = async (id) => {
        try {
            await api.put(`/admin/demote/${id}`);
            showMsg("Admin demoted to User!"); fetchData();
        } catch { showMsg("Failed to demote"); }
    };

    const filteredVendors = vendors.filter((v) =>
        v.shopName?.toLowerCase().includes(vendorSearch.toLowerCase()) ||
        v.userId?.email?.toLowerCase().includes(vendorSearch.toLowerCase())
    );

    const filteredUsers = users.filter((u) =>
        u.name?.toLowerCase().includes(userSearch.toLowerCase()) ||
        u.email?.toLowerCase().includes(userSearch.toLowerCase())
    );

    const chartData = stats ? [
        { name: "Users", value: stats.totalUsers, color: "#22c55e" },
        { name: "Vendors", value: stats.totalVendors, color: "#3b82f6" },
        { name: "Products", value: stats.totalProducts, color: "#f59e0b" },
        { name: "Reports", value: stats.reportedProducts, color: "#ef4444" },
    ] : [];

    return (
        <div className="min-h-screen bg-gray-50">
            <Navbar />

            <div className="max-w-6xl mx-auto px-4 py-10">
                {msg && (
                    <p className="text-green-600 text-sm mb-4 bg-green-50 px-4 py-2 rounded-lg">
                        {msg}
                    </p>
                )}

                {/* platform stats */}
                {stats && (
                    <div className="grid grid-cols-2 md:grid-cols-4 gap-4 mb-6">
                        {[
                            { label: "Total Users", value: stats.totalUsers, color: "text-green-600", bg: "bg-green-50" },
                            { label: "Total Vendors", value: stats.totalVendors, color: "text-blue-600", bg: "bg-blue-50" },
                            { label: "Total Products", value: stats.totalProducts, color: "text-yellow-600", bg: "bg-yellow-50" },
                            { label: "Reported Products", value: stats.reportedProducts, color: "text-red-600", bg: "bg-red-50" },
                        ].map((s) => (
                            <div key={s.label} className={`${s.bg} rounded-xl p-4 text-center`}>
                                <p className={`text-3xl font-bold ${s.color}`}>{s.value}</p>
                                <p className="text-gray-500 text-sm mt-1">{s.label}</p>
                            </div>
                        ))}
                    </div>
                )}

                {/* chart */}
                {stats && (
                    <div className="bg-white rounded-xl shadow p-6 mb-6">
                        <h3 className="text-lg font-semibold text-gray-700 mb-4">Platform Overview</h3>
                        <ResponsiveContainer width="100%" height={200}>
                            <BarChart data={chartData}>
                                <XAxis dataKey="name" />
                                <YAxis />
                                <Tooltip />
                                <Bar dataKey="value" radius={[6, 6, 0, 0]}>
                                    {chartData.map((entry, index) => (
                                        <Cell key={index} fill={entry.color} />
                                    ))}
                                </Bar>
                            </BarChart>
                        </ResponsiveContainer>
                    </div>
                )}

                {/* tabs */}
                <div className="flex gap-2 mb-6 flex-wrap">
                    {["vendors", "users", "products", "reports"].map((tab) => (
                        <button
                            key={tab}
                            onClick={() => setActiveTab(tab)}
                            className={`px-4 py-2 rounded-lg text-sm font-medium capitalize ${
                                activeTab === tab
                                    ? "bg-green-500 text-white"
                                    : "bg-white text-gray-600 border hover:bg-gray-50"
                            }`}
                        >
                            {tab}
                        </button>
                    ))}
                </div>

                {/* vendors */}
                {activeTab === "vendors" && (
                    <div className="bg-white rounded-xl shadow p-6">
                        <div className="flex justify-between items-center mb-4">
                            <h3 className="text-lg font-semibold text-gray-700">All Vendors</h3>
                            <input
                                type="text"
                                placeholder="Search vendor..."
                                value={vendorSearch}
                                onChange={(e) => setVendorSearch(e.target.value)}
                                className="border px-3 py-1 rounded-lg text-sm focus:outline-none focus:ring-2 focus:ring-green-400"
                            />
                        </div>
                        {filteredVendors.length === 0 ? (
                            <p className="text-gray-400 text-sm">No vendors found</p>
                        ) : (
                            <div className="space-y-3">
                                {/* flagged vendors pehle dikhao */}
                                {[...filteredVendors]
                                    .sort((a, b) => {
                                        const order = { flagged: 0, warning: 1, clean: 2 };
                                        return (order[a.flagStatus] ?? 2) - (order[b.flagStatus] ?? 2);
                                    })
                                    .map((vendor) => (
                                        <div
                                            key={vendor._id}
                                            className={`border rounded-lg px-4 py-3 ${
                                                vendor.flagStatus === "flagged"
                                                    ? "border-red-300 bg-red-50"
                                                    : vendor.flagStatus === "warning"
                                                    ? "border-yellow-200 bg-yellow-50"
                                                    : "border-gray-100"
                                            }`}
                                        >
                                            <div className="flex justify-between items-start">
                                                <div>
                                                    <div className="flex items-center gap-2 flex-wrap mb-1">
                                                        <p className="font-medium text-gray-800">{vendor.shopName}</p>
                                                        {/* flag badge */}
                                                        {vendor.flagStatus === "flagged" && (
                                                            <span className="text-xs bg-red-100 text-red-600 px-2 py-0.5 rounded-full font-medium animate-pulse">
                                                                🚨 Flagged — Review Pending
                                                            </span>
                                                        )}
                                                        {vendor.flagStatus === "warning" && (
                                                            <span className="text-xs bg-yellow-100 text-yellow-600 px-2 py-0.5 rounded-full font-medium">
                                                                ⚠️ Warning
                                                            </span>
                                                        )}
                                                        {vendor.isVerified && (
                                                            <span className="text-blue-500 text-xs font-medium">✓ Verified</span>
                                                        )}
                                                        {!vendor.isActive && (
                                                            <span className="text-red-500 text-xs font-medium">Banned</span>
                                                        )}
                                                    </div>
                                                    <p className="text-gray-500 text-sm">{vendor.userId?.email}</p>
                                                    <p className="text-gray-400 text-xs">
                                                        Joined: {new Date(vendor.createdAt).toLocaleDateString()}
                                                    </p>
                                                    {/* total reports count */}
                                                    {vendor.totalReportsReceived > 0 && (
                                                        <p className={`text-xs font-medium mt-1 ${
                                                            vendor.flagStatus === "flagged"
                                                                ? "text-red-500"
                                                                : "text-yellow-500"
                                                        }`}>
                                                            {vendor.totalReportsReceived} report{vendor.totalReportsReceived > 1 ? "s" : ""} received
                                                        </p>
                                                    )}
                                                </div>
                                                <div className="flex gap-2 flex-wrap justify-end">
                                                    <button
                                                        onClick={() => viewVendorActivity(vendor)}
                                                        className={`text-white px-3 py-1 rounded text-sm ${
                                                            vendor.flagStatus === "flagged"
                                                                ? "bg-red-500 hover:bg-red-600"
                                                                : "bg-gray-500 hover:bg-gray-600"
                                                        }`}
                                                    >
                                                        {vendor.flagStatus === "flagged" ? "🔍 Review Now" : "View Activity"}
                                                    </button>
                                                    {vendor.isVerified ? (
                                                        <button
                                                            onClick={() => askConfirm("Unverify this vendor?", () => unverifyVendor(vendor._id))}
                                                            className="bg-yellow-500 text-white px-3 py-1 rounded text-sm hover:bg-yellow-600"
                                                        >
                                                            Unverify
                                                        </button>
                                                    ) : (
                                                        <button
                                                            onClick={() => askConfirm("Verify this vendor?", () => verifyVendor(vendor._id))}
                                                            className="bg-blue-500 text-white px-3 py-1 rounded text-sm hover:bg-blue-600"
                                                        >
                                                            Verify
                                                        </button>
                                                    )}
                                                    {vendor.isActive ? (
                                                        <button
                                                            onClick={() => askConfirm("Ban this vendor?", () => banVendor(vendor._id))}
                                                            className="bg-red-500 text-white px-3 py-1 rounded text-sm hover:bg-red-600"
                                                        >
                                                            Ban
                                                        </button>
                                                    ) : (
                                                        <button
                                                            onClick={() => askConfirm("Unban this vendor?", () => unbanVendor(vendor._id))}
                                                            className="bg-green-500 text-white px-3 py-1 rounded text-sm hover:bg-green-600"
                                                        >
                                                            Unban
                                                        </button>
                                                    )}
                                                </div>
                                            </div>
                                        </div>
                                    ))}
                            </div>
                        )}
                    </div>
                )}

                {/* users */}
                {activeTab === "users" && (
                    <div className="bg-white rounded-xl shadow p-6">
                        <div className="flex justify-between items-center mb-4">
                            <h3 className="text-lg font-semibold text-gray-700">All Users</h3>
                            <input
                                type="text"
                                placeholder="Search user..."
                                value={userSearch}
                                onChange={(e) => setUserSearch(e.target.value)}
                                className="border px-3 py-1 rounded-lg text-sm focus:outline-none focus:ring-2 focus:ring-green-400"
                            />
                        </div>
                        {filteredUsers.length === 0 ? (
                            <p className="text-gray-400 text-sm">No users found</p>
                        ) : (
                            <div className="space-y-3">
                                {filteredUsers.map((user) => (
                                    <div key={user._id} className="flex justify-between items-center border rounded-lg px-4 py-3">
                                        <div>
                                            <p className="font-medium text-gray-800">{user.name}</p>
                                            <p className="text-gray-500 text-sm">{user.email}</p>
                                            <p className="text-gray-400 text-xs">Joined: {new Date(user.createdAt).toLocaleDateString()}</p>
                                            <p className="text-gray-400 text-xs">Alerts: {user.priceAlerts?.length || 0}</p>
                                            <span className={`text-xs font-medium ${user.role === "admin" ? "text-purple-500" : ""}`}>
                                                {user.role === "admin" ? "Admin" : ""}
                                            </span>
                                            {user.isBanned && <span className="text-red-500 text-xs font-medium ml-1">Banned</span>}
                                        </div>
                                        <div className="flex gap-2 flex-wrap justify-end">
                                            {/* promote/demote toggle */}
                                            {user.role === "admin" ? (
                                                <button
                                                    onClick={() => askConfirm("Demote this admin to User?", () => demoteToUser(user._id))}
                                                    className="bg-orange-500 text-white px-3 py-1 rounded text-sm hover:bg-orange-600"
                                                >
                                                    Remove Admin
                                                </button>
                                            ) : (
                                                <button
                                                    onClick={() => askConfirm("Promote this user to Admin?", () => promoteToAdmin(user._id))}
                                                    className="bg-purple-500 text-white px-3 py-1 rounded text-sm hover:bg-purple-600"
                                                >
                                                    Make Admin
                                                </button>
                                            )}
                                            {user.isBanned ? (
                                                <button onClick={() => askConfirm("Unban this user?", () => unbanUser(user._id))} className="bg-green-500 text-white px-3 py-1 rounded text-sm hover:bg-green-600">Unban</button>
                                            ) : (
                                                <button onClick={() => askConfirm("Ban this user?", () => banUser(user._id))} className="bg-red-500 text-white px-3 py-1 rounded text-sm hover:bg-red-600">Ban</button>
                                            )}
                                        </div>
                                    </div>
                                ))}
                            </div>
                        )}
                    </div>
                )}

                {/* products */}
                {activeTab === "products" && (
                    <div className="bg-white rounded-xl shadow p-6">
                        <h3 className="text-lg font-semibold text-gray-700 mb-4">All Products</h3>
                        {products.length === 0 ? (
                            <p className="text-gray-400 text-sm">No products found</p>
                        ) : (
                            <div className="space-y-3">
                                {products.map((product) => (
                                    <div key={product._id} className="border rounded-lg px-4 py-3">
                                        <div className="flex justify-between items-start">
                                            <div>
                                                <p className="font-medium text-gray-800">{product.name}</p>
                                                <p className="text-gray-500 text-sm">{product.vendorId?.shopName}</p>
                                                <p className="text-green-600 font-bold">₹{product.currentPrice} / {product.unit}</p>
                                            </div>
                                            <button
                                                onClick={() => askConfirm("Delete this product?", () => deleteProduct(product._id))}
                                                className="bg-red-500 text-white px-3 py-1 rounded text-sm hover:bg-red-600"
                                            >
                                                Delete
                                            </button>
                                        </div>
                                        <div className="flex gap-2 mt-3">
                                            <input
                                                type="number"
                                                placeholder="Override price (₹)"
                                                value={overrideInputs[product._id] || ""}
                                                onChange={(e) => setOverrideInputs({ ...overrideInputs, [product._id]: e.target.value })}
                                                className="flex-1 border px-3 py-1 rounded text-sm focus:outline-none focus:ring-2 focus:ring-green-400"
                                            />
                                            <button
                                                onClick={() => overridePrice(product._id)}
                                                className="bg-yellow-500 text-white px-3 py-1 rounded text-sm hover:bg-yellow-600"
                                            >
                                                Override Price
                                            </button>
                                        </div>
                                    </div>
                                ))}
                            </div>
                        )}
                    </div>
                )}

                {/* reports */}
                {activeTab === "reports" && (
                    <div className="bg-white rounded-xl shadow p-6">
                        <h3 className="text-lg font-semibold text-gray-700 mb-4">Reported Products</h3>
                        {reported.length === 0 ? (
                            <p className="text-gray-400 text-sm">No reported products</p>
                        ) : (
                            <div className="space-y-4">
                                {reported.map((product) => (
                                    <div key={product._id} className="border rounded-lg px-4 py-3">
                                        <div className="flex justify-between items-start">
                                            <div>
                                                <p className="font-medium text-gray-800">{product.name}</p>
                                                <p
                                                    onClick={() => {
                                                        const v = vendors.find(v => v._id === product.vendorId?._id);
                                                        if (v) viewVendorActivity(v);
                                                    }}
                                                    className="text-blue-500 text-sm cursor-pointer hover:underline"
                                                >
                                                    {product.vendorId?.shopName}
                                                </p>
                                                <p className="text-green-600 font-bold mt-1">₹{product.currentPrice}</p>
                                            </div>
                                            <button
                                                onClick={() => askConfirm("Delete this product?", () => deleteProduct(product._id))}
                                                className="bg-red-500 text-white px-3 py-1 rounded text-sm hover:bg-red-600"
                                            >
                                                Delete Product
                                            </button>
                                        </div>
                                        <div className="mt-3 border-t pt-3 space-y-2">
                                            <p className="text-xs font-semibold text-gray-500">{product.reports.length} Report(s):</p>
                                            {product.reports.map((r, i) => (
                                                <div key={i} className="bg-red-50 rounded px-3 py-2">
                                                    <p className="text-xs text-gray-700">
                                                        <span className="font-medium">User: </span>
                                                        {r.userId?.name || "Unknown"} ({r.userId?.email || "N/A"})
                                                    </p>
                                                    <p className="text-xs text-red-500 mt-1">
                                                        <span className="font-medium">Reason: </span>{r.reason}
                                                    </p>
                                                    <p className="text-xs text-gray-400 mt-1">
                                                        {new Date(r.reportedAt).toLocaleDateString()}
                                                    </p>
                                                </div>
                                            ))}
                                        </div>
                                    </div>
                                ))}
                            </div>
                        )}
                    </div>
                )}
            </div>

            {/* vendor activity modal */}
            {selectedVendor && vendorActivity && (
                <div className="fixed inset-0 bg-black bg-opacity-50 flex items-center justify-center z-50 px-4">
                    <div className="bg-white rounded-xl shadow-xl w-full max-w-lg max-h-[80vh] overflow-y-auto p-6">
                        <div className="flex justify-between items-center mb-4">
                            <h3 className="text-lg font-bold text-gray-800">{selectedVendor.shopName} — Activity</h3>
                            <button onClick={closeModal} className="text-gray-400 hover:text-gray-600 text-xl">✕</button>
                        </div>
                        <div className="bg-gray-50 rounded-lg p-4 mb-4 space-y-1">
                            <p className="text-sm text-gray-700"><span className="font-medium">Owner: </span>{vendorActivity.vendor.userId?.name}</p>
                            <p className="text-sm text-gray-700"><span className="font-medium">Email: </span>{vendorActivity.vendor.userId?.email}</p>
                            <p className="text-sm text-gray-700"><span className="font-medium">Address: </span>{vendorActivity.vendor.shopAddress}</p>
                            <p className="text-sm text-gray-700"><span className="font-medium">Rating: </span>{vendorActivity.vendor.rating?.average} ⭐ ({vendorActivity.vendor.rating?.totalReviews} reviews)</p>
                            <div className="flex gap-4 mt-2">
                                <span className="text-green-600 text-sm font-medium">Products: {vendorActivity.totalProducts}</span>
                                <span className="text-red-500 text-sm font-medium">Total Reports: {vendorActivity.totalReports}</span>
                            </div>
                        </div>
                        <h4 className="text-sm font-semibold text-gray-600 mb-2">Products:</h4>
                        <div className="space-y-2">
                            {vendorActivity.products.map((p) => (
                                <div key={p._id} className="border rounded px-3 py-2">
                                    <div className="flex justify-between items-center">
                                        <div>
                                            <p className="text-sm font-medium text-gray-800">{p.name}</p>
                                            <p className="text-xs text-gray-500">₹{p.currentPrice} / {p.unit}</p>
                                        </div>
                                        <p className={`text-xs ${p.isAvailable ? "text-green-500" : "text-gray-400"}`}>
                                            {p.isAvailable ? "Available" : "Unavailable"}
                                        </p>
                                    </div>
                                    {p.reports.length > 0 && (
                                        <div className="mt-2 space-y-1">
                                            <p className="text-xs font-semibold text-red-500">{p.reports.length} Report(s):</p>
                                            {p.reports.map((r, i) => (
                                                <div key={i} className="bg-red-50 rounded px-2 py-1">
                                                    <p className="text-xs text-gray-700 font-medium">By: {r.reportedBy} ({r.reportedEmail})</p>
                                                    <p className="text-xs text-red-500">{r.reason}</p>
                                                    <p className="text-xs text-gray-400">{new Date(r.reportedAt).toLocaleDateString()}</p>
                                                </div>
                                            ))}
                                        </div>
                                    )}
                                </div>
                            ))}
                        </div>
                    </div>
                </div>
            )}

            {/* confirmation dialog */}
            {confirm.show && (
                <div className="fixed inset-0 bg-black bg-opacity-40 flex items-center justify-center z-50">
                    <div className="bg-white rounded-xl shadow-xl p-6 w-80">
                        <p className="text-gray-800 font-medium text-center mb-6">{confirm.msg}</p>
                        <div className="flex gap-3 justify-center">
                            <button onClick={handleCancel} className="px-5 py-2 rounded-lg border text-gray-600 hover:bg-gray-50 text-sm">Cancel</button>
                            <button onClick={handleConfirm} className="px-5 py-2 rounded-lg bg-red-500 text-white hover:bg-red-600 text-sm">Confirm</button>
                        </div>
                    </div>
                </div>
            )}
        </div>
    );
};

export default AdminDashboard;