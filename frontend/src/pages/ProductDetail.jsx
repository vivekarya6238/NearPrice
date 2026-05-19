import { useState, useEffect } from "react";
import { useParams, useNavigate } from "react-router-dom";
import {
    AreaChart, Area, XAxis, YAxis, Tooltip, ResponsiveContainer, CartesianGrid
} from "recharts";
import api from "../utils/api";
import { useAuth } from "../context/AuthContext";
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

// star rating component
const StarRating = ({ value, onChange, readonly = false }) => {
    const [hovered, setHovered] = useState(0);

    return (
        <div className="flex gap-1">
            {[1, 2, 3, 4, 5].map((star) => (
                <button
                    key={star}
                    disabled={readonly}
                    onClick={() => !readonly && onChange(star)}
                    onMouseEnter={() => !readonly && setHovered(star)}
                    onMouseLeave={() => !readonly && setHovered(0)}
                    className={`text-2xl transition ${readonly ? "cursor-default" : "cursor-pointer hover:scale-110"}`}
                >
                    <span className={
                        (hovered || value) >= star
                            ? "text-yellow-400"
                            : "text-gray-200"
                    }>
                        ★
                    </span>
                </button>
            ))}
        </div>
    );
};

const ProductDetail = () => {
    const { id } = useParams();
    const navigate = useNavigate();
    const { user } = useAuth();
    const [product, setProduct] = useState(null);
    const [history, setHistory] = useState([]);
    const [prediction, setPrediction] = useState(null);
    const [alertPrice, setAlertPrice] = useState("");
    const [reportReason, setReportReason] = useState("");
    const [showReportBox, setShowReportBox] = useState(false);
    const [toast, setToast] = useState(null);
    const [userLocation, setUserLocation] = useState(null);
    const [distance, setDistance] = useState(null);
    const [isFavourite, setIsFavourite] = useState(false);
    const [userRating, setUserRating] = useState(0);
    const [ratingSubmitted, setRatingSubmitted] = useState(false);

    const showMsg = (text, type = "success") => {
        setToast({ message: text, type });
    };

    useEffect(() => {
        api.get(`/product/${id}`).then((res) => setProduct(res.data));
        api.get(`/product/${id}/price-history`).then((res) => setHistory(res.data));
        api.get(`/product/${id}/predict`).then((res) => setPrediction(res.data));

        if (navigator.geolocation) {
            navigator.geolocation.getCurrentPosition((pos) => {
                setUserLocation({ lat: pos.coords.latitude, lng: pos.coords.longitude });
            });
        }
    }, [id]);

    // check favourites + existing rating
    useEffect(() => {
        if (user && user.role === "user") {
            api.get("/user/favourites").then((res) => {
                const favIds = res.data.map((f) => f._id);
                setIsFavourite(favIds.includes(id));
            });

            // check if user already rated this vendor
            api.get("/user/my-ratings").then((res) => {
                const found = res.data.find(
                    (r) => r.vendorId === product?.vendorId?._id
                );
                if (found) {
                    setUserRating(found.rating);
                    setRatingSubmitted(true);
                }
            }).catch(() => {});
        }
    }, [id, user, product]);

    useEffect(() => {
        if (userLocation && product?.vendorId?.location?.coordinates) {
            const [lng2, lat2] = product.vendorId.location.coordinates;
            const R = 6371;
            const dLat = ((lat2 - userLocation.lat) * Math.PI) / 180;
            const dLng = ((lng2 - userLocation.lng) * Math.PI) / 180;
            const a =
                Math.sin(dLat / 2) * Math.sin(dLat / 2) +
                Math.cos((userLocation.lat * Math.PI) / 180) *
                Math.cos((lat2 * Math.PI) / 180) *
                Math.sin(dLng / 2) * Math.sin(dLng / 2);
            setDistance((R * 2 * Math.atan2(Math.sqrt(a), Math.sqrt(1 - a))).toFixed(1));
        }
    }, [userLocation, product]);

    const handleFavourite = async () => {
        if (!user) { navigate("/login"); return; }
        try {
            const res = await api.post(`/user/favourite/${id}`);
            setIsFavourite(!isFavourite);
            showMsg(res.data.msg);
        } catch {
            showMsg("Failed to update favourites", "error");
        }
    };

    const handleAlert = async () => {
        try {
            await api.post("/user/set-alert", {
                productId: id,
                targetPrice: parseFloat(alertPrice),
            });
            showMsg("Price alert set successfully!");
            setAlertPrice("");
        } catch {
            showMsg("Failed to set alert", "error");
        }
    };

    const handleReport = async () => {
        if (!reportReason.trim()) {
            showMsg("Please enter a reason", "error");
            return;
        }
        try {
            await api.post(`/product/${id}/report`, { reason: reportReason });
            showMsg("Report submitted!");
            setReportReason("");
            setShowReportBox(false);
        } catch {
            showMsg("Failed to submit report", "error");
        }
    };

    const handleShare = () => {
        navigator.clipboard.writeText(window.location.href);
        showMsg("Link copied to clipboard!");
    };

    const handleRating = async (star) => {
        if (!user) { navigate("/login"); return; }
        try {
            setUserRating(star);
            await api.post(`/vendor/${product.vendorId._id}/rate`, { rating: star });
            setRatingSubmitted(true);
            showMsg(ratingSubmitted ? "Rating updated!" : "Thanks for rating!");

            // update vendor rating in UI
            const updated = await api.get(`/product/${id}`);
            setProduct(updated.data);
        } catch {
            showMsg("Failed to submit rating", "error");
        }
    };

    const chartData = history.map((h) => ({
        date: new Date(h.date).toLocaleDateString("en-IN", { day: "2-digit", month: "short" }),
        price: h.price,
    }));

    const mapsUrl = `https://www.google.com/maps/search/?api=1&query=${encodeURIComponent(product?.vendorId?.shopAddress || "")}`;

    if (!product) return (
        <div className="min-h-screen bg-gray-50">
            <Navbar />
            <div className="flex items-center justify-center h-64">
                <p className="text-gray-400">Loading...</p>
            </div>
        </div>
    );

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

                {/* product header */}
                <div className="bg-white rounded-2xl border border-gray-100 overflow-hidden mb-4">
                    {product.image && (
                        <div className="relative">
                            <img
                                src={product.image}
                                alt={product.name}
                                className={`w-full h-56 object-cover ${!product.isAvailable ? "opacity-60" : ""}`}
                            />
                            {!product.isAvailable && (
                                <div className="absolute inset-0 bg-black bg-opacity-40 flex items-center justify-center">
                                    <span className="bg-red-500 text-white text-sm px-4 py-2 rounded-full font-medium">
                                        Out of Stock
                                    </span>
                                </div>
                            )}
                        </div>
                    )}
                    <div className="p-5">
                        <div className="flex items-start justify-between">
                            <div>
                                <div className="flex items-center gap-2 mb-1">
                                    <span className="text-2xl">{categoryIcon(product.category)}</span>
                                    <span className="text-xs text-gray-400 bg-gray-50 px-2 py-0.5 rounded-full capitalize">
                                        {product.category}
                                    </span>
                                </div>
                                <h1 className="text-2xl font-bold text-gray-900 capitalize">
                                    {product.name}
                                </h1>
                                <p className="text-green-600 font-bold text-3xl mt-1">
                                    ₹{product.currentPrice}
                                    <span className="text-gray-400 text-base font-normal"> / {product.unit}</span>
                                </p>

                                <div className="mt-2">
                                    {product.isAvailable ? (
                                        <span className="inline-flex items-center gap-1 bg-green-50 text-green-600 text-sm px-3 py-1 rounded-full">
                                            ● In Stock
                                        </span>
                                    ) : (
                                        <span className="inline-flex items-center gap-1 bg-red-50 text-red-500 text-sm px-3 py-1 rounded-full">
                                            ● Out of Stock
                                        </span>
                                    )}
                                </div>

                                {product.description && (
                                    <p className="text-gray-400 text-sm mt-2">{product.description}</p>
                                )}
                            </div>

                            <div className="flex gap-2">
                                {user && user.role === "user" && (
                                    <button
                                        onClick={handleFavourite}
                                        className={`p-2 text-xl transition ${
                                            isFavourite ? "text-red-500" : "text-gray-300 hover:text-red-400"
                                        }`}
                                    >
                                        {isFavourite ? "❤️" : "🤍"}
                                    </button>
                                )}
                                <button
                                    onClick={handleShare}
                                    className="text-gray-400 hover:text-green-500 transition p-2 text-xl"
                                >
                                    🔗
                                </button>
                            </div>
                        </div>
                    </div>
                </div>

                {/* vendor card */}
                <div className="bg-white rounded-2xl border border-gray-100 p-5 mb-4">
                    <div className="flex justify-between items-start">
                        <div>
                            <div className="flex items-center gap-2">
                                <h3 className="font-semibold text-gray-800">
                                    {product.vendorId?.shopName}
                                </h3>
                                {product.vendorId?.verificationBadge && (
                                    <span className="text-blue-500 text-xs bg-blue-50 px-2 py-0.5 rounded-full">
                                        ✓ Verified
                                    </span>
                                )}
                            </div>
                            <p className="text-gray-400 text-sm mt-1">
                                📍 {product.vendorId?.shopAddress}
                            </p>
                            {distance && (
                                <p className="text-green-600 text-sm mt-1 font-medium">
                                    🚶 {distance} km away
                                </p>
                            )}

                            {/* vendor rating display */}
                            {product.vendorId?.rating?.totalReviews > 0 ? (
                                <div className="flex items-center gap-2 mt-2">
                                    <StarRating value={Math.round(product.vendorId.rating.average)} readonly />
                                    <span className="text-sm text-gray-500">
                                        {product.vendorId.rating.average} ({product.vendorId.rating.totalReviews} reviews)
                                    </span>
                                </div>
                            ) : (
                                <p className="text-gray-300 text-sm mt-2">No reviews yet</p>
                            )}
                        </div>
                        <a
                            href={mapsUrl}
                            target="_blank"
                            rel="noreferrer"
                            className="text-sm bg-green-50 text-green-600 px-3 py-1.5 rounded-lg hover:bg-green-100 transition font-medium"
                        >
                            Get Directions
                        </a>
                    </div>

                    {/* rating input — only for logged in users */}
                    {user && user.role === "user" && (
                        <div className="mt-4 pt-4 border-t border-gray-100">
                            <p className="text-sm font-medium text-gray-700 mb-2">
                                {ratingSubmitted ? "Your Rating" : "Rate this vendor"}
                            </p>
                            <div className="flex items-center gap-3">
                                <StarRating value={userRating} onChange={handleRating} />
                                {ratingSubmitted && (
                                    <span className="text-xs text-green-500 font-medium">
                                        ✓ Rated
                                    </span>
                                )}
                            </div>
                            {!ratingSubmitted && (
                                <p className="text-xs text-gray-400 mt-1">
                                    Click a star to rate
                                </p>
                            )}
                        </div>
                    )}
                </div>

                {/* 7 day price chart */}
                <div className="bg-white rounded-2xl border border-gray-100 p-5 mb-4">
                    <h2 className="font-semibold text-gray-800 mb-4">📊 7 Day Price Trend</h2>
                    {chartData.length > 1 ? (
                        <ResponsiveContainer width="100%" height={200}>
                            <AreaChart data={chartData}>
                                <defs>
                                    <linearGradient id="priceGradient" x1="0" y1="0" x2="0" y2="1">
                                        <stop offset="5%" stopColor="#22c55e" stopOpacity={0.2} />
                                        <stop offset="95%" stopColor="#22c55e" stopOpacity={0} />
                                    </linearGradient>
                                </defs>
                                <CartesianGrid strokeDasharray="3 3" stroke="#f0f0f0" />
                                <XAxis dataKey="date" tick={{ fontSize: 11 }} />
                                <YAxis tick={{ fontSize: 11 }} />
                                <Tooltip
                                    formatter={(value) => [`₹${value}`, "Price"]}
                                    contentStyle={{ borderRadius: "8px", border: "1px solid #f0f0f0" }}
                                />
                                <Area
                                    type="monotone"
                                    dataKey="price"
                                    stroke="#22c55e"
                                    strokeWidth={2.5}
                                    fill="url(#priceGradient)"
                                    dot={{ fill: "#22c55e", strokeWidth: 2, r: 4 }}
                                />
                            </AreaChart>
                        </ResponsiveContainer>
                    ) : (
                        <div className="text-center py-8">
                            <p className="text-gray-300 text-4xl mb-2">📈</p>
                            <p className="text-gray-400 text-sm">Not enough data yet</p>
                        </div>
                    )}
                </div>

                {/* price prediction */}
                {prediction && !prediction.error && prediction.trend && (
                    <div className="bg-white rounded-2xl border border-gray-100 p-5 mb-4">
                        <h2 className="font-semibold text-gray-800 mb-3">🤖 Price Prediction</h2>
                        <div className="grid grid-cols-3 gap-3">
                            <div className="bg-gray-50 rounded-xl p-3 text-center">
                                <p className="text-xs text-gray-400 mb-1">Trend</p>
                                <p className={`font-bold text-sm ${
                                    prediction.trend === "increasing" ? "text-red-500" :
                                    prediction.trend === "decreasing" ? "text-green-500" :
                                    "text-gray-500"
                                }`}>
                                    {prediction.trend === "increasing" ? "📈 Rising" :
                                     prediction.trend === "decreasing" ? "📉 Falling" : "➡️ Stable"}
                                </p>
                            </div>
                            <div className="bg-gray-50 rounded-xl p-3 text-center">
                                <p className="text-xs text-gray-400 mb-1">Predicted</p>
                                <p className="font-bold text-sm text-gray-800">
                                    ₹{prediction.predictedPrice || product.currentPrice}
                                </p>
                            </div>
                            <div className="bg-gray-50 rounded-xl p-3 text-center">
                                <p className="text-xs text-gray-400 mb-1">Probability</p>
                                <p className="font-bold text-sm text-gray-800">
                                    {prediction.probability}%
                                </p>
                            </div>
                        </div>
                    </div>
                )}

                {/* price alert */}
                {user && user.role === "user" && product.isAvailable && (
                    <div className="bg-white rounded-2xl border border-gray-100 p-5 mb-4">
                        <h2 className="font-semibold text-gray-800 mb-3">🔔 Set Price Alert</h2>
                        <div className="flex gap-2">
                            <input
                                type="number"
                                placeholder="Alert me when price drops to ₹"
                                value={alertPrice}
                                onChange={(e) => setAlertPrice(e.target.value)}
                                className="flex-1 border border-gray-200 px-4 py-2 rounded-xl focus:outline-none focus:ring-2 focus:ring-green-400 text-sm"
                            />
                            <button
                                onClick={handleAlert}
                                className="bg-green-500 text-white px-4 py-2 rounded-xl hover:bg-green-600 text-sm font-medium"
                            >
                                Set Alert
                            </button>
                        </div>
                    </div>
                )}

                {/* report */}
                <div className="bg-white rounded-2xl border border-gray-100 p-5">
                    <div className="flex justify-between items-center">
                        <p className="text-gray-400 text-sm">Something wrong with this price?</p>
                        <button
                            onClick={() => setShowReportBox(!showReportBox)}
                            className="text-red-400 text-sm hover:text-red-500 font-medium"
                        >
                            Report ⚠️
                        </button>
                    </div>
                    {showReportBox && (
                        <div className="mt-3 space-y-2">
                            <textarea
                                placeholder="Describe the issue (e.g. actual price is ₹60, not ₹40)"
                                value={reportReason}
                                onChange={(e) => setReportReason(e.target.value)}
                                className="w-full border border-gray-200 px-4 py-2 rounded-xl focus:outline-none focus:ring-2 focus:ring-red-300 text-sm resize-none"
                                rows={3}
                            />
                            <button
                                onClick={handleReport}
                                className="w-full bg-red-500 text-white py-2 rounded-xl hover:bg-red-600 text-sm font-medium"
                            >
                                Submit Report
                            </button>
                        </div>
                    )}
                </div>
            </div>
        </div>
    );
};

export default ProductDetail;