import { useState, useEffect } from "react";
import { useNavigate } from "react-router-dom";
import { useAuth } from "../context/AuthContext";
import api from "../utils/api";
import Navbar from "../components/Navbar";
import Toast from "../components/Toast";

const categoryIcon = (category) => {
    const icons = {
        vegetables: "🥬", fruits: "🍎", grocery: "🛒",
        electronics: "📱", clothing: "👕", medicine: "💊",
        home: "🏠", automotive: "🚗", books: "📚",
        food: "🍕", other: "📦",
    };
    return icons[category] || "📦";
};

const UserDashboard = () => {
    const { user, logout } = useAuth();
    const navigate = useNavigate();
    const [alerts, setAlerts] = useState([]);
    const [favourites, setFavourites] = useState([]);
    const [myReports, setMyReports] = useState([]);
    const [activeTab, setActiveTab] = useState("alerts");
    const [toast, setToast] = useState(null);
    const [editMode, setEditMode] = useState(false);
    const [newName, setNewName] = useState("");
    const [currentPassword, setCurrentPassword] = useState("");
    const [newPassword, setNewPassword] = useState("");

    const showMsg = (text, type = "success") => {
        setToast({ message: text, type });
    };

    useEffect(() => {
        api.get("/user/my-alerts").then((res) => setAlerts(res.data)).catch(() => {});
        api.get("/user/favourites").then((res) => setFavourites(res.data)).catch(() => {});
        api.get("/user/my-reports").then((res) => setMyReports(res.data)).catch(() => {});
        if (user) setNewName(user.name);
    }, [user]);

    const handleUpdateProfile = async () => {
        try {
            await api.put("/user/update-profile", { name: newName });
            showMsg("Profile updated! Please login again.");
            setNewName("");
            setCurrentPassword("");
            setNewPassword("");
            setEditMode(false);
            setTimeout(() => { logout(); navigate("/login"); }, 2000);
        } catch {
            showMsg("Failed to update profile", "error");
        }
    };

    const handleChangePassword = async () => {
        try {
            await api.put("/auth/change-password", { currentPassword, newPassword });
            showMsg("Password changed! Please login again.");
            setCurrentPassword("");
            setNewPassword("");
            setTimeout(() => { logout(); navigate("/login"); }, 2000);
        } catch (err) {
            showMsg(err?.response?.data?.msg || "Failed to change password", "error");
        }
    };

    const handleRemoveFavourite = async (productId) => {
        try {
            await api.post(`/user/favourite/${productId}`);
            setFavourites(favourites.filter((f) => f._id !== productId));
            showMsg("Removed from favourites!");
        } catch {
            showMsg("Failed to remove", "error");
        }
    };

    const handleRemoveAlert = async (alertId, productId) => {
        try {
            if (!productId) {
                setAlerts(alerts.filter((a) => a._id !== alertId));
                return;
            }
            await api.post("/user/set-alert", { productId, targetPrice: 0 });
            setAlerts(alerts.filter((a) => a._id !== alertId));
            showMsg("Alert removed!");
        } catch {
            showMsg("Failed to remove alert", "error");
        }
    };

    return (
        <div className="min-h-screen bg-gray-50">
            <Navbar />

            {toast && (
                <Toast
                    message={toast.message}
                    type={toast.type}
                    onClose={() => setToast(null)}
                />
            )}

            <div className="max-w-3xl mx-auto px-4 py-8">

                {/* profile card */}
                <div className="bg-white rounded-2xl border border-gray-100 p-6 mb-6">
                    <div className="flex items-center justify-between mb-4">
                        <div className="flex items-center gap-4">
                            <div className="w-16 h-16 rounded-full bg-green-500 flex items-center justify-center text-white text-2xl font-bold">
                                {user?.name?.charAt(0).toUpperCase()}
                            </div>
                            <div>
                                <h2 className="text-xl font-bold text-gray-900">{user?.name}</h2>
                                <p className="text-gray-400 text-sm">{user?.email}</p>
                                <span className="text-xs bg-green-50 text-green-600 px-2 py-0.5 rounded-full font-medium mt-1 inline-block">
                                    Member
                                </span>
                            </div>
                        </div>
                        <div className="flex gap-2">
                            <button
                                onClick={() => {
                                    if (!editMode) {
                                        setNewName("");
                                        setCurrentPassword("");
                                        setNewPassword("");
                                    }
                                    setEditMode(!editMode);
                                }}
                                className="text-sm text-gray-500 border border-gray-200 px-3 py-1.5 rounded-lg hover:bg-gray-50 transition"
                            >
                                ✏️ Edit
                            </button>
                            <button
                                onClick={() => { logout(); navigate("/"); }}
                                className="text-sm text-red-400 border border-red-100 px-3 py-1.5 rounded-lg hover:bg-red-50 transition"
                            >
                                Logout
                            </button>
                        </div>
                    </div>

                    {editMode && (
                        <div className="border-t border-gray-100 pt-4 mt-2">
                            <p className="text-sm font-medium text-gray-700 mb-3">Edit Profile</p>
                            
                            {/* name change */}
                            <div className="flex gap-2 mb-4">
                                <input
                                    type="text"
                                    value={newName}
                                    onChange={(e) => setNewName(e.target.value)}
                                    placeholder="New name"
                                    className="flex-1 border border-gray-200 px-4 py-2 rounded-xl focus:outline-none focus:ring-2 focus:ring-green-400 text-sm"
                                />
                                <button
                                    onClick={handleUpdateProfile}
                                    className="bg-green-500 text-white px-4 py-2 rounded-xl text-sm hover:bg-green-600"
                                >
                                    Save
                                </button>
                                <button
                                    onClick={() => {
                                        setEditMode(false);
                                        setNewName("");
                                        setCurrentPassword("");
                                        setNewPassword("");
                                    }}
                                    className="border border-gray-200 text-gray-500 px-4 py-2 rounded-xl text-sm hover:bg-gray-50"
                                >
                                    Cancel
                                </button>
                            </div>

                            {/* password change — alag section */}
                            <div className="border-t border-gray-100 pt-4">
                                <p className="text-sm font-medium text-gray-700 mb-3">Change Password</p>
                                <div className="space-y-2">
                                    <input
                                        type="password"
                                        placeholder="Current Password"
                                        value={currentPassword}
                                        onChange={(e) => setCurrentPassword(e.target.value)}
                                        className="w-full border border-gray-200 px-4 py-2 rounded-xl focus:outline-none focus:ring-2 focus:ring-green-400 text-sm"
                                    />
                                    <input
                                        type="password"
                                        placeholder="New Password"
                                        value={newPassword}
                                        onChange={(e) => setNewPassword(e.target.value)}
                                        className="w-full border border-gray-200 px-4 py-2 rounded-xl focus:outline-none focus:ring-2 focus:ring-green-400 text-sm"
                                    />
                                    <button
                                        onClick={handleChangePassword}
                                        className="w-full bg-gray-800 text-white py-2 rounded-xl text-sm hover:bg-gray-900 transition"
                                    >
                                        Change Password
                                    </button>
                                </div>
                            </div>
                        </div>
                    )}

                    {/* stats */}
                    <div className="grid grid-cols-3 gap-4 mt-4">
                        <div
                            onClick={() => setActiveTab("alerts")}
                            className={`rounded-xl p-4 text-center cursor-pointer transition ${
                                activeTab === "alerts" ? "bg-green-50" : "bg-gray-50 hover:bg-green-50"
                            }`}
                        >
                            <p className="text-2xl font-bold text-green-600">{alerts.length}</p>
                            <p className="text-gray-400 text-sm mt-1">🔔 Price Alerts</p>
                        </div>
                        <div
                            onClick={() => setActiveTab("favourites")}
                            className={`rounded-xl p-4 text-center cursor-pointer transition ${
                                activeTab === "favourites" ? "bg-red-50" : "bg-gray-50 hover:bg-red-50"
                            }`}
                        >
                            <p className="text-2xl font-bold text-red-500">{favourites.length}</p>
                            <p className="text-gray-400 text-sm mt-1">❤️ Favourites</p>
                        </div>
                        <div
                            onClick={() => setActiveTab("reports")}
                            className={`rounded-xl p-4 text-center cursor-pointer transition ${
                                activeTab === "reports" ? "bg-orange-50" : "bg-gray-50 hover:bg-orange-50"
                            }`}
                        >
                            <p className="text-2xl font-bold text-orange-500">{myReports.length}</p>
                            <p className="text-gray-400 text-sm mt-1">🚨 My Reports</p>
                        </div>
                    </div>

                    <button
                        onClick={() => navigate("/")}
                        className="w-full mt-4 bg-green-500 text-white py-2.5 rounded-xl text-sm font-medium hover:bg-green-600 transition"
                    >
                        🔍 Search Products
                    </button>
                </div>

                {/* tabs */}
                <div className="flex gap-2 mb-6">
                    {[
                        { key: "alerts", label: "🔔 Price Alerts" },
                        { key: "favourites", label: "❤️ Favourites" },
                        { key: "reports", label: "🚨 My Reports" },
                    ].map((tab) => (
                        <button
                            key={tab.key}
                            onClick={() => setActiveTab(tab.key)}
                            className={`px-5 py-2 rounded-xl text-sm font-medium transition ${
                                activeTab === tab.key
                                    ? "bg-green-500 text-white"
                                    : "bg-white text-gray-500 border border-gray-200 hover:bg-gray-50"
                            }`}
                        >
                            {tab.label}
                        </button>
                    ))}
                </div>

                {/* price alerts */}
                {activeTab === "alerts" && (
                    <div className="bg-white rounded-2xl border border-gray-100 p-5">
                        <h3 className="font-semibold text-gray-800 mb-4">🔔 My Price Alerts</h3>
                        {alerts.length === 0 ? (
                            <div className="text-center py-10">
                                <p className="text-4xl mb-2">🔔</p>
                                <p className="text-gray-400 text-sm">No alerts set yet</p>
                                <button
                                    onClick={() => navigate("/")}
                                    className="mt-4 bg-green-500 text-white px-4 py-2 rounded-xl text-sm hover:bg-green-600"
                                >
                                    Search Products
                                </button>
                            </div>
                        ) : (
                            <div className="space-y-3">
                                {alerts.map((alert) => (
                                    <div
                                        key={alert._id}
                                        className="flex items-center gap-3 border border-gray-100 rounded-xl p-3 hover:bg-gray-50 transition"
                                    >
                                        <div
                                            onClick={() => alert.productId?._id && navigate(`/product/${alert.productId._id}`)}
                                            className="cursor-pointer flex-shrink-0"
                                        >
                                            {alert.productId?.image ? (
                                                <img
                                                    src={alert.productId.image}
                                                    alt={alert.productId.name}
                                                    className="w-14 h-14 rounded-lg object-cover"
                                                />
                                            ) : (
                                                <div className="w-14 h-14 rounded-lg bg-gray-100 flex items-center justify-center text-2xl">
                                                    {categoryIcon(alert.productId?.category)}
                                                </div>
                                            )}
                                        </div>
                                        <div
                                            className="flex-1 cursor-pointer"
                                            onClick={() => alert.productId?._id && navigate(`/product/${alert.productId._id}`)}
                                        >
                                            <p className="font-medium text-gray-800 capitalize">
                                                {alert.productId?.name || "Product"}
                                            </p>
                                            <p className="text-gray-400 text-xs">
                                                Current: ₹{alert.productId?.currentPrice || "N/A"}
                                            </p>
                                            {alert.productId?.currentPrice <= alert.targetPrice && (
                                                <span className="text-xs bg-green-50 text-green-600 px-2 py-0.5 rounded-full">
                                                    ✓ Target reached!
                                                </span>
                                            )}
                                        </div>
                                        <div className="text-right">
                                            <p className="text-green-600 font-bold text-sm">
                                                Alert: ₹{alert.targetPrice}
                                            </p>
                                        </div>
                                        <button
                                            onClick={() => handleRemoveAlert(alert._id, alert.productId?._id)}
                                            className="text-gray-300 hover:text-red-400 transition text-lg flex-shrink-0"
                                        >
                                            ✕
                                        </button>
                                    </div>
                                ))}
                            </div>
                        )}
                    </div>
                )}

                {/* favourites */}
                {activeTab === "favourites" && (
                    <div className="bg-white rounded-2xl border border-gray-100 p-5">
                        <h3 className="font-semibold text-gray-800 mb-4">❤️ My Favourites</h3>
                        {favourites.length === 0 ? (
                            <div className="text-center py-10">
                                <p className="text-4xl mb-2">❤️</p>
                                <p className="text-gray-400 text-sm">No favourites added yet</p>
                                <button
                                    onClick={() => navigate("/")}
                                    className="mt-4 bg-green-500 text-white px-4 py-2 rounded-xl text-sm hover:bg-green-600"
                                >
                                    Browse Products
                                </button>
                            </div>
                        ) : (
                            <div className="grid grid-cols-2 gap-4">
                                {favourites.map((product) => (
                                    <div
                                        key={product._id}
                                        className="border border-gray-100 rounded-xl overflow-hidden hover:shadow-md transition"
                                    >
                                        <div
                                            className="relative cursor-pointer"
                                            onClick={() => navigate(`/product/${product._id}`)}
                                        >
                                            {product.image ? (
                                                <img
                                                    src={product.image}
                                                    alt={product.name}
                                                    className="w-full h-32 object-cover"
                                                />
                                            ) : (
                                                <div className="w-full h-32 bg-gray-50 flex items-center justify-center text-4xl">
                                                    {categoryIcon(product.category)}
                                                </div>
                                            )}
                                            {!product.isAvailable && (
                                                <div className="absolute inset-0 bg-black bg-opacity-40 flex items-center justify-center">
                                                    <span className="bg-red-500 text-white text-xs px-2 py-1 rounded-full">
                                                        Out of Stock
                                                    </span>
                                                </div>
                                            )}
                                        </div>
                                        <div className="p-3">
                                            <div className="flex justify-between items-start">
                                                <div
                                                    className="cursor-pointer flex-1"
                                                    onClick={() => navigate(`/product/${product._id}`)}
                                                >
                                                    <p className="font-medium text-gray-800 text-sm capitalize">
                                                        {product.name}
                                                    </p>
                                                    <p className="text-green-600 font-bold">
                                                        ₹{product.currentPrice}
                                                        <span className="text-gray-400 text-xs font-normal"> /{product.unit}</span>
                                                    </p>
                                                    <p className="text-gray-400 text-xs mt-0.5 truncate">
                                                        {product.vendorId?.shopName}
                                                    </p>
                                                </div>
                                                <button
                                                    onClick={() => handleRemoveFavourite(product._id)}
                                                    className="text-red-400 hover:text-red-500 transition text-lg flex-shrink-0"
                                                >
                                                    ❤️
                                                </button>
                                            </div>
                                        </div>
                                    </div>
                                ))}
                            </div>
                        )}
                    </div>
                )}

                {/* my reports */}
                {activeTab === "reports" && (
                    <div className="bg-white rounded-2xl border border-gray-100 p-5">
                        <h3 className="font-semibold text-gray-800 mb-4">🚨 My Reports</h3>
                        {myReports.length === 0 ? (
                            <div className="text-center py-10">
                                <p className="text-4xl mb-2">✅</p>
                                <p className="text-gray-400 text-sm">No reports submitted yet</p>
                                <button
                                    onClick={() => navigate("/")}
                                    className="mt-4 bg-green-500 text-white px-4 py-2 rounded-xl text-sm hover:bg-green-600"
                                >
                                    Browse Products
                                </button>
                            </div>
                        ) : (
                            <div className="space-y-3">
                                {myReports.map((report, idx) => (
                                    <div
                                        key={idx}
                                        className="border border-orange-100 rounded-xl p-4 bg-orange-50"
                                    >
                                        <div className="flex items-center gap-3 mb-2">
                                            {report.productId?.image ? (
                                                <img
                                                    src={report.productId.image}
                                                    alt={report.productId.name}
                                                    className="w-12 h-12 rounded-lg object-cover cursor-pointer"
                                                    onClick={() => navigate(`/product/${report.productId._id}`)}
                                                />
                                            ) : (
                                                <div className="w-12 h-12 rounded-lg bg-gray-100 flex items-center justify-center text-xl">
                                                    {categoryIcon(report.productId?.category)}
                                                </div>
                                            )}
                                            <div className="flex-1">
                                                <p
                                                    className="font-medium text-gray-800 capitalize cursor-pointer hover:text-green-600"
                                                    onClick={() => report.productId?._id && navigate(`/product/${report.productId._id}`)}
                                                >
                                                    {report.productId?.name || "Product"}
                                                </p>
                                                <p className="text-xs text-gray-400">
                                                    {report.productId?.vendorId?.shopName || ""}
                                                </p>
                                            </div>
                                            <p className="text-xs text-gray-300">
                                                {new Date(report.reportedAt).toLocaleDateString("en-IN", {
                                                    day: "2-digit",
                                                    month: "short",
                                                })}
                                            </p>
                                        </div>
                                        <p className="text-sm text-gray-600 bg-white rounded-lg px-3 py-2 border border-orange-100">
                                            "{report.reason}"
                                        </p>
                                    </div>
                                ))}
                            </div>
                        )}
                    </div>
                )}
            </div>
        </div>
    );
};

export default UserDashboard;