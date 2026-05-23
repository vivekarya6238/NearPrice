import { useState, useEffect, useCallback } from "react";
import { useAuth } from "../context/AuthContext";
import api from "../utils/api";
import Navbar from "../components/Navbar";
import Toast from "../components/Toast";

const unitOptions = {
    vegetables: ["kg", "gram", "dozen", "piece"],
    fruits: ["kg", "gram", "dozen", "piece"],
    grocery: ["kg", "gram", "litre", "packet"],
    electronics: ["unit"],
    clothing: ["unit", "pair", "set"],
    medicine: ["strip", "bottle", "unit"],
    home: ["unit", "set", "pair"],
    automotive: ["unit"],
    books: ["unit"],
    food: ["litre", "ml", "packet", "unit"],
    other: ["unit", "kg", "piece"],
};

const categoryIcon = (category) => {
    const icons = {
        vegetables: "🥬", fruits: "🍎", grocery: "🛒",
        electronics: "📱", clothing: "👕", medicine: "💊",
        home: "🏠", automotive: "🚗", books: "📚",
        food: "🍕", other: "📦",
    };
    return icons[category] || "📦";
};

const defaultUnits = {
    vegetables: "kg", fruits: "kg", grocery: "kg",
    electronics: "unit", clothing: "unit", medicine: "strip",
    home: "unit", automotive: "unit", books: "unit",
    food: "packet", other: "unit",
};

const FlagBadge = ({ status }) => {
    if (!status || status === "clean") return null;
    return (
        <span className={`text-xs px-3 py-1 rounded-full font-medium ${
            status === "flagged"
                ? "bg-red-100 text-red-600"
                : "bg-yellow-100 text-yellow-600"
        }`}>
            {status === "flagged" ? "🚨 Flagged — Admin Review Pending" : "⚠️ Warning — Reports Received"}
        </span>
    );
};

const MarketInsight = ({ insight, currentPrice, productName }) => {
    if (!insight) return null;

    const price = parseFloat(currentPrice);
    let warning = null;

    if (price && insight.avg) {
        const diff = ((price - insight.avg) / insight.avg) * 100;
        if (diff > 50) {
            warning = { type: "high", msg: `⚠️ Market average se ${Math.round(diff)}% zyada hai` };
        } else if (diff < -30) {
            warning = { type: "low", msg: `✅ Market se ${Math.abs(Math.round(diff))}% kam — accha price!` };
        } else {
            warning = { type: "ok", msg: "✅ Price is within market range" };
        }
    }

    return (
        <div className="bg-blue-50 border border-blue-100 rounded-lg p-3 mt-2">
            <p className="text-xs font-semibold text-blue-700 mb-2">
                📊 Market Price Insight — "<span className="capitalize">{productName}</span>"
            </p>
            <div className="grid grid-cols-3 gap-2 mb-2">
                <div className="text-center">
                    <p className="text-xs text-gray-400">Average</p>
                    <p className="text-sm font-bold text-gray-700">₹{insight.avg}</p>
                </div>
                <div className="text-center">
                    <p className="text-xs text-gray-400">Lowest</p>
                    <p className="text-sm font-bold text-green-600">₹{insight.min}</p>
                </div>
                <div className="text-center">
                    <p className="text-xs text-gray-400">Highest</p>
                    <p className="text-sm font-bold text-red-500">₹{insight.max}</p>
                </div>
            </div>
            <p className="text-xs text-gray-400">
                💡 Suggested range: ₹{insight.min} — ₹{insight.max}
            </p>
            {warning && (
                <p className={`text-xs mt-2 font-medium ${
                    warning.type === "high" ? "text-red-500" : "text-green-600"
                }`}>
                    {warning.msg}
                </p>
            )}
            <p className="text-xs text-gray-300 mt-1">
                Based on {insight.count} vendor{insight.count > 1 ? "s" : ""}
            </p>
        </div>
    );
};

const VendorDashboard = () => {
    const { user } = useAuth();
    const [products, setProducts] = useState([]);
    const [vendor, setVendor] = useState(null);
    const [form, setForm] = useState({
        name: "", category: "vegetables", description: "",
        currentPrice: "", unit: "kg", tags: "", image: null
    });
    const [marketInsight, setMarketInsight] = useState(null);
    const [toast, setToast] = useState(null);
    const [updatePrice, setUpdatePrice] = useState({});
    const [activeTab, setActiveTab] = useState("products");

    useEffect(() => {
        api.get("/vendor/me").then((res) => setVendor(res.data)).catch(() => {});
        fetchProducts();
    }, []);

    const showMsg = (text, type = "success") => {
        setToast({ message: text, type });
    };

    const fetchProducts = async () => {
        try {
            const vendorRes = await api.get("/vendor/me");
            const res = await api.get(`/product/search?query=&showAll=true`);
            const vendorId = vendorRes.data._id;
            const filtered = res.data.products.filter(
                (p) => p.vendorId?._id === vendorId || p.vendorId === vendorId
            );
            setProducts(filtered);
        } catch {}
    };

    const fetchMarketInsight = useCallback(async (name, category) => {
    const trimmed = name.trim();
        if (trimmed.length === 0) {   
            setMarketInsight(null);
            return;
        }
        try {
            const res = await api.get(`/product/market-insight?name=${name}&category=${category}`);
            setMarketInsight(res.data);
        } catch {
            setMarketInsight(null);
        }
    }, []);

    const handleCategoryChange = (category) => {
        setForm({ ...form, category, unit: defaultUnits[category] });
    };

    const handleNameChange = (e) => {
        const name = e.target.value;
        setForm({ ...form, name });
        fetchMarketInsight(name.trim(), form.category);
    };

    const handleAdd = async (e) => {
        e.preventDefault();
        try {
            const formData = new FormData();
            formData.append("name", form.name);
            formData.append("category", form.category);
            formData.append("description", form.description);
            formData.append("currentPrice", form.currentPrice);
            formData.append("unit", form.unit);
            formData.append("tags", form.tags);
            if (form.image) formData.append("image", form.image);

            await api.post("/product/add", formData, {
                headers: { "Content-Type": "multipart/form-data" }
            });
            showMsg("Product added successfully!");
            setForm({ name: "", category: "vegetables", description: "", currentPrice: "", unit: "kg", tags: "", image: null });
            setMarketInsight(null);
            fetchProducts();
        } catch {
            showMsg("Failed to add product", "error");
        }
    };

    const handlePriceUpdate = async (productId) => {
        try {
            await api.put(`/product/update-price/${productId}`, {
                currentPrice: parseFloat(updatePrice[productId]),
            });
            showMsg("Price updated!");
            fetchProducts();
        } catch {
            showMsg("Failed to update price", "error");
        }
    };

    const handleDelete = async (productId) => {
        try {
            await api.delete(`/product/${productId}`);
            showMsg("Product deleted!");
            fetchProducts();
        } catch {
            showMsg("Failed to delete product", "error");
        }
    };

    const handleToggleAvailability = async (productId, currentStatus) => {
        try {
            await api.put(`/vendor/product/${productId}/toggle`);
            showMsg(
                currentStatus ? "Marked Out of Stock!" : "Marked In Stock!",
                currentStatus ? "error" : "success"
            );
            fetchProducts();
        } catch {
            showMsg("Failed to update", "error");
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

            <div className="max-w-4xl mx-auto px-4 py-10">

                {/* shop header */}
                <div className="flex items-center justify-between mb-6">
                    <div>
                        <h2 className="text-2xl font-bold text-gray-800">
                            {vendor?.shopName || "My Shop"}
                        </h2>
                        <p className="text-gray-400 text-sm mt-0.5">{vendor?.shopAddress}</p>
                        {vendor?.flagStatus && vendor.flagStatus !== "clean" && (
                            <div className="mt-2">
                                <FlagBadge status={vendor.flagStatus} />
                                <p className="text-xs text-gray-400 mt-1">
                                    Total reports received: {vendor.totalReportsReceived}
                                </p>
                            </div>
                        )}
                    </div>
                    {vendor?.verificationBadge && (
                        <span className="text-blue-500 text-sm font-semibold bg-blue-50 px-3 py-1 rounded-full">
                            ✓ Verified
                        </span>
                    )}
                </div>

                {/* add product form */}
                <div className="bg-white rounded-xl shadow-sm border border-gray-100 p-6 mb-6">
                    <h3 className="text-lg font-semibold text-gray-700 mb-4">Add New Product</h3>
                    <form onSubmit={handleAdd} className="space-y-3">

                        <div>
                            <input
                                type="text"
                                placeholder="Product Name"
                                value={form.name}
                                onChange={handleNameChange}
                                className="w-full border px-4 py-2 rounded-lg focus:outline-none focus:ring-2 focus:ring-green-400"
                                required
                            />
                            <MarketInsight
                                insight={marketInsight}
                                currentPrice={form.currentPrice}
                                productName={form.name}
                            />
                        </div>

                        <select
                            value={form.category}
                            onChange={(e) => handleCategoryChange(e.target.value)}
                            className="w-full border px-4 py-2 rounded-lg focus:outline-none focus:ring-2 focus:ring-green-400"
                        >
                            <option value="vegetables">🥬 Vegetables</option>
                            <option value="fruits">🍎 Fruits</option>
                            <option value="grocery">🛒 Grocery & Staples</option>
                            <option value="electronics">📱 Electronics & Accessories</option>
                            <option value="clothing">👕 Clothing & Apparel</option>
                            <option value="medicine">💊 Medicine & Healthcare</option>
                            <option value="home">🏠 Home & Kitchen</option>
                            <option value="automotive">🚗 Automotive</option>
                            <option value="books">📚 Books & Stationery</option>
                            <option value="food">🍕 Food & Beverages</option>
                            <option value="other">📦 Other</option>
                        </select>

                        <input
                            type="text"
                            placeholder="Description"
                            value={form.description}
                            onChange={(e) => setForm({ ...form, description: e.target.value })}
                            className="w-full border px-4 py-2 rounded-lg focus:outline-none focus:ring-2 focus:ring-green-400"
                        />

                        <div className="flex gap-2">
                            <input
                                type="number"
                                placeholder="Price (₹)"
                                value={form.currentPrice}
                                onChange={(e) => setForm({ ...form, currentPrice: e.target.value })}
                                className="flex-1 border px-4 py-2 rounded-lg focus:outline-none focus:ring-2 focus:ring-green-400"
                                required
                            />
                            <select
                                value={form.unit}
                                onChange={(e) => setForm({ ...form, unit: e.target.value })}
                                className="border px-4 py-2 rounded-lg focus:outline-none focus:ring-2 focus:ring-green-400"
                            >
                                {(unitOptions[form.category] || ["unit"]).map((u) => (
                                    <option key={u} value={u}>{u}</option>
                                ))}
                            </select>
                        </div>

                        <input
                            type="text"
                            placeholder="Tags (comma separated e.g. fresh, organic, daily use)"
                            value={form.tags}
                            onChange={(e) => setForm({ ...form, tags: e.target.value })}
                            className="w-full border px-4 py-2 rounded-lg focus:outline-none focus:ring-2 focus:ring-green-400"
                        />

                        <div className="border border-dashed border-gray-300 rounded-lg px-4 py-3">
                            <p className="text-gray-400 text-sm mb-2">Product Image (optional)</p>
                            <input
                                type="file"
                                accept="image/*"
                                onChange={(e) => setForm({ ...form, image: e.target.files[0] })}
                                className="w-full text-sm text-gray-500"
                            />
                            {form.image && (
                                <p className="text-green-500 text-xs mt-1">✓ {form.image.name}</p>
                            )}
                        </div>

                        <button
                            type="submit"
                            className="w-full bg-green-500 text-white py-2 rounded-lg hover:bg-green-600 transition font-medium"
                        >
                            Add Product
                        </button>
                    </form>
                </div>

                {/* product list */}
                {/* tabs */}
                <div className="flex gap-2 mb-4">
                    {[
                        { key: "products", label: "📦 My Products" },
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

                {/* my products tab */}
                {activeTab === "products" && (
                    <div className="bg-white rounded-xl shadow-sm border border-gray-100 p-6">
                        <h3 className="text-lg font-semibold text-gray-700 mb-4">
                            My Products ({products.length})
                        </h3>
                        {products.length === 0 ? (
                            <div className="text-center py-8">
                                <p className="text-4xl mb-2">📦</p>
                                <p className="text-gray-400 text-sm">No products added yet</p>
                            </div>
                        ) : (
                            <div className="space-y-3">
                                {products.map((product) => (
                                    <div key={product._id} className={`border rounded-lg p-3 ${
                                        !product.isAvailable ? "border-red-100 bg-red-50" : "border-gray-100"
                                    }`}>
                                        <div className="flex gap-3 items-start">
                                            {product.image ? (
                                                <img
                                                    src={product.image}
                                                    alt={product.name}
                                                    className={`w-14 h-14 rounded-lg object-cover ${
                                                        !product.isAvailable ? "opacity-50" : ""
                                                    }`}
                                                />
                                            ) : (
                                                <div className="w-14 h-14 rounded-lg bg-gray-100 flex items-center justify-center text-2xl">
                                                    {categoryIcon(product.category)}
                                                </div>
                                            )}
                                            <div className="flex-1">
                                                <div className="flex items-center gap-2 flex-wrap">
                                                    <p className="font-medium text-gray-800">{product.name}</p>
                                                    <span className={`text-xs px-2 py-0.5 rounded-full font-medium ${
                                                        product.isAvailable
                                                            ? "bg-green-50 text-green-600"
                                                            : "bg-red-50 text-red-500"
                                                    }`}>
                                                        {product.isAvailable ? "● In Stock" : "● Out of Stock"}
                                                    </span>
                                                    {product.reports?.length > 0 && (
                                                        <span className="text-xs px-2 py-0.5 rounded-full bg-orange-50 text-orange-500 font-medium">
                                                            ⚠️ {product.reports.length} report{product.reports.length > 1 ? "s" : ""}
                                                        </span>
                                                    )}
                                                </div>
                                                <p className="text-green-600 font-bold">
                                                    ₹{product.currentPrice} / {product.unit}
                                                </p>
                                                <p className="text-gray-400 text-xs capitalize">{product.category}</p>
                                                <div className="flex gap-2 mt-2 items-center flex-wrap">
                                                    <input
                                                        type="number"
                                                        placeholder="New price"
                                                        value={updatePrice[product._id] || ""}
                                                        onChange={(e) => setUpdatePrice({ ...updatePrice, [product._id]: e.target.value })}
                                                        className="border px-2 py-1 rounded w-24 text-sm focus:outline-none focus:ring-2 focus:ring-green-400"
                                                    />
                                                    <button
                                                        onClick={() => handlePriceUpdate(product._id)}
                                                        className="bg-green-500 text-white px-3 py-1 rounded text-sm hover:bg-green-600"
                                                    >
                                                        Update
                                                    </button>
                                                    <button
                                                        onClick={() => handleToggleAvailability(product._id, product.isAvailable)}
                                                        className={`px-3 py-1 rounded text-sm font-medium ${
                                                            product.isAvailable
                                                                ? "bg-yellow-500 text-white hover:bg-yellow-600"
                                                                : "bg-green-100 text-green-600 hover:bg-green-200"
                                                        }`}
                                                    >
                                                        {product.isAvailable ? "Out of Stock" : "In Stock"}
                                                    </button>
                                                    <button
                                                        onClick={() => handleDelete(product._id)}
                                                        className="bg-red-500 text-white px-3 py-1 rounded text-sm hover:bg-red-600"
                                                    >
                                                        Delete
                                                    </button>
                                                </div>
                                            </div>
                                        </div>
                                    </div>
                                ))}
                            </div>
                        )}
                    </div>
                )}

                {/* my reports tab */}
                {activeTab === "reports" && (
                    <div className="bg-white rounded-xl shadow-sm border border-gray-100 p-6">
                        <h3 className="text-lg font-semibold text-gray-700 mb-4">
                            🚨 Reports on My Products
                        </h3>
                        {products.filter(p => p.reports?.length > 0).length === 0 ? (
                            <div className="text-center py-8">
                                <p className="text-4xl mb-2">✅</p>
                                <p className="text-gray-400 text-sm">No reports yet — keep it up!</p>
                            </div>
                        ) : (
                            <div className="space-y-4">
                                {products
                                    .filter(p => p.reports?.length > 0)
                                    .map(product => (
                                        <div key={product._id} className="border border-orange-100 rounded-lg p-4 bg-orange-50">
                                            <div className="flex items-center gap-3 mb-3">
                                                {product.image ? (
                                                    <img
                                                        src={product.image}
                                                        alt={product.name}
                                                        className="w-12 h-12 rounded-lg object-cover"
                                                    />
                                                ) : (
                                                    <div className="w-12 h-12 rounded-lg bg-gray-100 flex items-center justify-center text-xl">
                                                        {categoryIcon(product.category)}
                                                    </div>
                                                )}
                                                <div>
                                                    <p className="font-semibold text-gray-800 capitalize">{product.name}</p>
                                                    <p className="text-xs text-orange-500 font-medium">
                                                        ⚠️ {product.reports.length} report{product.reports.length > 1 ? "s" : ""}
                                                    </p>
                                                </div>
                                            </div>
                                            <div className="space-y-2">
                                                {product.reports.map((report, idx) => (
                                                    <div key={idx} className="bg-white rounded-lg p-3 border border-orange-100">
                                                        <div className="flex items-start justify-between gap-2">
                                                            <div>
                                                                <p className="text-xs font-medium text-gray-600 mb-1">
                                                                    👤 {report.userId?.name || "User"}
                                                                </p>
                                                                <p className="text-sm text-gray-700">
                                                                    "{report.reason}"
                                                                </p>
                                                            </div>
                                                            <p className="text-xs text-gray-300 whitespace-nowrap">
                                                                {new Date(report.reportedAt).toLocaleDateString("en-IN", {
                                                                    day: "2-digit",
                                                                    month: "short"
                                                                })}
                                                            </p>
                                                        </div>
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
        </div>
    );
};

export default VendorDashboard;