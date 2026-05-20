import { useState, useEffect, useRef } from "react";
import { useNavigate } from "react-router-dom";
import api from "../utils/api";
import Navbar from "../components/Navbar";
import { useAuth } from "../context/AuthContext";

const categoryIcon = (category) => {
    const icons = {
        vegetables: "🥬", fruits: "🍎", grocery: "🛒",
        electronics: "📱", clothing: "👕", medicine: "💊",
        home: "🏠", automotive: "🚗", books: "📚",
        food: "🍕", other: "📦",
    };
    return icons[category] || "📦";
};

const distanceOptions = [
    { label: "2 km", value: 2000 },
    { label: "5 km", value: 5000 },
    { label: "10 km", value: 10000 },
    { label: "20 km", value: 20000 },
    { label: "All", value: null },
];

const Footer = () => (
    <footer className="bg-white border-t border-gray-100 mt-16">
        <div className="max-w-6xl mx-auto px-4 py-8">
            <div className="flex flex-col sm:flex-row items-center justify-between gap-4">
                <div>
                    <h3 className="text-lg font-extrabold text-gray-900">
                        Near<span className="text-green-500">Price</span>
                    </h3>
                    <p className="text-gray-400 text-xs mt-1">
                        Sahi Daam, Sahi Jagah — Hyperlocal price comparison for Bharat 🇮🇳
                    </p>
                </div>
                <p className="text-gray-300 text-xs">
                    © 2024 NearPrice. All rights reserved.
                </p>
            </div>
        </div>
    </footer>
);

const Home = () => {
    const navigate = useNavigate();
    const { user } = useAuth();
    const [query, setQuery] = useState("");
    const [products, setProducts] = useState([]);
    const [latestProducts, setLatestProducts] = useState([]);
    const [trendingProducts, setTrendingProducts] = useState([]);
    const [suggestions, setSuggestions] = useState([]);
    const [loading, setLoading] = useState(false);
    const [loadingMore, setLoadingMore] = useState(false);
    const [searched, setSearched] = useState(false);
    const [showSuggestions, setShowSuggestions] = useState(false);
    const [userLocation, setUserLocation] = useState(null);
    const [selectedDistance, setSelectedDistance] = useState(null);
    const [locationStatus, setLocationStatus] = useState("pending");
    const [latestPage, setLatestPage] = useState(1);
    const [latestHasMore, setLatestHasMore] = useState(false);
    const [searchPage, setSearchPage] = useState(1);
    const [searchHasMore, setSearchHasMore] = useState(false);
    const suggestRef = useRef(null);

    useEffect(() => {
        fetchLatest(1);
        api.get("/product/trending").then((res) => setTrendingProducts(res.data));

        if (navigator.geolocation) {
            navigator.geolocation.getCurrentPosition(
                (pos) => {
                    setUserLocation({ lat: pos.coords.latitude, lng: pos.coords.longitude });
                    setLocationStatus("allowed");
                },
                () => setLocationStatus("denied")
            );
        } else {
            setLocationStatus("denied");
        }

        const handleClick = (e) => {
            if (suggestRef.current && !suggestRef.current.contains(e.target)) {
                setShowSuggestions(false);
            }
        };
        document.addEventListener("mousedown", handleClick);
        return () => document.removeEventListener("mousedown", handleClick);
    }, []);

    const fetchLatest = async (page) => {
        try {
            const res = await api.get(`/product/latest?page=${page}`);
            if (page === 1) {
                setLatestProducts(res.data.products);
            } else {
                setLatestProducts((prev) => [...prev, ...res.data.products]);
            }
            setLatestHasMore(res.data.hasMore);
            setLatestPage(page);
        } catch {}
    };

    const loadMoreLatest = async () => {
        setLoadingMore(true);
        await fetchLatest(latestPage + 1);
        setLoadingMore(false);
    };

    const getDistance = (coordinates) => {
        if (!userLocation || !coordinates) return null;
        const [lng2, lat2] = coordinates;
        const R = 6371;
        const dLat = ((lat2 - userLocation.lat) * Math.PI) / 180;
        const dLng = ((lng2 - userLocation.lng) * Math.PI) / 180;
        const a =
            Math.sin(dLat / 2) * Math.sin(dLat / 2) +
            Math.cos((userLocation.lat * Math.PI) / 180) *
            Math.cos((lat2 * Math.PI) / 180) *
            Math.sin(dLng / 2) * Math.sin(dLng / 2);
        return (R * 2 * Math.atan2(Math.sqrt(a), Math.sqrt(1 - a))).toFixed(1);
    };

    const handleQueryChange = async (e) => {
        const val = e.target.value;
        setQuery(val);

        if (val.length === 0) {
            setSearched(false);
            setProducts([]);
            setSuggestions([]);
            setShowSuggestions(false);
            return;
        }

        if (val.length >= 2) {
            try {
                const res = await api.get(`/product/suggestions?query=${val}`);
                setSuggestions(res.data);
                setShowSuggestions(true);
            } catch {
                setSuggestions([]);
            }
        } else {
            setSuggestions([]);
            setShowSuggestions(false);
        }
    };

    const handleSearch = async (e, page = 1) => {
        if (e) e.preventDefault();
        if (!query.trim()) return;
        setLoading(true);
        setSearched(true);
        setShowSuggestions(false);
        try {
            if (selectedDistance && userLocation) {
                const nearbyRes = await api.get(
                    `/product/nearby?longitude=${userLocation.lng}&latitude=${userLocation.lat}&distance=${selectedDistance}`
                );
                const nearbyIds = nearbyRes.data.map((p) => p._id);
                const searchRes = await api.get(`/product/search?query=${query}&page=${page}`);
                const filtered = searchRes.data.products.filter((p) => nearbyIds.includes(p._id));
                if (page === 1) {
                    setProducts(filtered);
                } else {
                    setProducts((prev) => [...prev, ...filtered]);
                }
                setSearchHasMore(searchRes.data.hasMore);
            } else {
                const res = await api.get(`/product/search?query=${query}&page=${page}`);
                if (page === 1) {
                    setProducts(res.data.products);
                } else {
                    setProducts((prev) => [...prev, ...res.data.products]);
                }
                setSearchHasMore(res.data.hasMore);
            }
            setSearchPage(page);
        } catch (err) {
            console.error("Search failed:", err);
        }
        setLoading(false);
    };

    const loadMoreSearch = async () => {
        setLoadingMore(true);
        await handleSearch(null, searchPage + 1);
        setLoadingMore(false);
    };

    const handleSuggestionClick = (name) => {
        setQuery(name);
        setShowSuggestions(false);
        setSearched(true);
        setLoading(true);
        api.get(`/product/search?query=${name}&page=1`).then((res) => {
            setProducts(res.data.products);
            setSearchHasMore(res.data.hasMore);
            setSearchPage(1);
            setLoading(false);
        });
    };

    const handleDistanceFilter = async (distance) => {
        setSelectedDistance(distance);
        if (searched && query) {
            setLoading(true);
            try {
                if (distance && userLocation) {
                    const nearbyRes = await api.get(
                        `/product/nearby?longitude=${userLocation.lng}&latitude=${userLocation.lat}&distance=${distance}`
                    );
                    const nearbyIds = nearbyRes.data.map((p) => p._id);
                    const searchRes = await api.get(`/product/search?query=${query}&page=1`);
                    setProducts(searchRes.data.products.filter((p) => nearbyIds.includes(p._id)));
                    setSearchHasMore(searchRes.data.hasMore);
                    setSearchPage(1);
                } else {
                    const res = await api.get(`/product/search?query=${query}&page=1`);
                    setProducts(res.data.products);
                    setSearchHasMore(res.data.hasMore);
                    setSearchPage(1);
                }
            } catch (err) {
                console.error("Filter failed:", err);
            }
            setLoading(false);
        }
    };

    const ProductCard = ({ product, index }) => {
        const dist = getDistance(product.vendorId?.location?.coordinates);

        return (
            <div
                onClick={() => {
                    if (!product.isAvailable) return;
                    if (!user) { navigate("/login"); return; }
                    navigate(`/product/${product._id}`);
                }}
                className={`bg-white rounded-xl border border-gray-100 overflow-hidden shadow-sm transition hover:shadow-md ${
                    product.isAvailable ? "cursor-pointer" : "cursor-not-allowed opacity-75"
                }`}
            >
                <div className="relative">
                    {product.image ? (
                        <img src={product.image} alt={product.name} className="w-full h-36 object-cover" />
                    ) : (
                        <div className="w-full h-36 bg-gray-50 flex items-center justify-center text-5xl">
                            {categoryIcon(product.category)}
                        </div>
                    )}
                    {!product.isAvailable && (
                        <div className="absolute inset-0 bg-black bg-opacity-40 flex items-center justify-center">
                            <span className="bg-red-500 text-white text-xs px-3 py-1 rounded-full font-medium">
                                Out of Stock
                            </span>
                        </div>
                    )}
                    {index === 0 && searched && product.isAvailable && (
                        <span className="absolute top-2 left-2 bg-green-500 text-white text-xs px-2 py-0.5 rounded-full font-medium">
                            🏆 Best Price
                        </span>
                    )}
                    {product.vendorId?.verificationBadge && (
                        <span className="absolute top-2 right-2 bg-blue-500 text-white text-xs px-2 py-0.5 rounded-full">
                            ✓ Verified
                        </span>
                    )}
                </div>
                <div className="p-3">
                    <div className="flex justify-between items-start mb-1">
                        <h3 className="font-semibold text-gray-800 text-sm capitalize">{product.name}</h3>
                        <span className="text-xs text-gray-400 capitalize">{product.category}</span>
                    </div>
                    <p className="text-green-600 font-bold text-xl">
                        ₹{product.currentPrice}
                        <span className="text-gray-400 text-xs font-normal"> /{product.unit}</span>
                    </p>
                    <div className="mt-2 pt-2 border-t border-gray-50">
                        <p className="text-gray-600 text-xs font-medium">{product.vendorId?.shopName}</p>
                        <p className="text-gray-400 text-xs mt-0.5 truncate">{product.vendorId?.shopAddress}</p>
                        <div className="flex items-center justify-between mt-1.5">
                            {product.vendorId?.rating?.totalReviews > 0 ? (
                                <p className="text-yellow-500 text-xs">
                                    ⭐ {product.vendorId.rating.average}
                                    <span className="text-gray-400"> ({product.vendorId.rating.totalReviews})</span>
                                </p>
                            ) : (
                                <p className="text-gray-300 text-xs">No reviews</p>
                            )}
                            {dist && <p className="text-green-600 text-xs font-medium">📍 {dist} km</p>}
                        </div>
                    </div>
                </div>
            </div>
        );
    };

    return (
        <div className="min-h-screen bg-gray-50 flex flex-col">
            <Navbar />

            <div className="bg-white border-b border-gray-100">
                <div className="max-w-3xl mx-auto px-4 py-16 text-center">
                    <p className="text-green-600 text-sm font-medium mb-3">🇮🇳 Made for Bharat</p>
                    <h1 className="text-4xl md:text-5xl font-extrabold text-gray-900 mb-4 leading-tight">
                        Sahi Daam,{" "}
                        <span className="text-green-500">Sahi Jagah</span>
                    </h1>
                    <p className="text-gray-400 text-base mb-8">
                        Compare prices from nearby vendors instantly.
                    </p>

                    <div ref={suggestRef} className="relative w-full max-w-lg mx-auto">
                        <form onSubmit={handleSearch} className="flex gap-2">
                            <input
                                type="text"
                                placeholder="Search for vegetables, fruits, grocery..."
                                value={query}
                                onChange={handleQueryChange}
                                className="flex-1 border border-gray-200 px-4 py-3 rounded-xl focus:outline-none focus:ring-2 focus:ring-green-400 text-gray-700 shadow-sm"
                            />
                            <button
                                type="submit"
                                className="bg-green-500 text-white px-6 py-3 rounded-xl hover:bg-green-600 transition font-medium"
                            >
                                Search
                            </button>
                        </form>

                        {showSuggestions && suggestions.length > 0 && (
                            <div className="absolute top-14 left-0 right-0 bg-white rounded-xl shadow-lg border border-gray-100 z-40 overflow-hidden">
                                {suggestions.map((s) => (
                                    <div
                                        key={s._id}
                                        onClick={() => handleSuggestionClick(s.name)}
                                        className="flex items-center gap-3 px-4 py-3 hover:bg-gray-50 cursor-pointer border-b border-gray-50 last:border-0"
                                    >
                                        <span className="text-xl">{categoryIcon(s.category)}</span>
                                        <span className="text-gray-700 text-sm capitalize">{s.name}</span>
                                    </div>
                                ))}
                            </div>
                        )}
                    </div>

                    {locationStatus === "allowed" && (
                        <div className="mt-4 flex items-center justify-center gap-2 flex-wrap">
                            <span className="text-gray-400 text-xs">📍 Filter by distance:</span>
                            {distanceOptions.map((opt) => (
                                <button
                                    key={opt.label}
                                    onClick={() => handleDistanceFilter(opt.value)}
                                    className={`text-xs px-3 py-1 rounded-full border transition ${
                                        selectedDistance === opt.value
                                            ? "bg-green-500 text-white border-green-500"
                                            : "bg-white text-gray-500 border-gray-200 hover:border-green-400"
                                    }`}
                                >
                                    {opt.label}
                                </button>
                            ))}
                        </div>
                    )}

                    {locationStatus === "denied" && (
                        <p className="text-gray-300 text-xs mt-3">
                            📍 Enable location for distance-based filtering
                        </p>
                    )}
                </div>
            </div>

            <div className="max-w-6xl mx-auto px-4 py-10 w-full flex-1">

                {/* search results */}
                {searched && (
                    <>
                        {loading && <p className="text-center text-gray-400 py-16">Searching...</p>}

                        {!loading && products.length === 0 && (
                            <div className="text-center py-16">
                                <p className="text-5xl mb-4">🔍</p>
                                <p className="text-gray-500 font-medium">No products found</p>
                                <p className="text-gray-400 text-sm mt-1">Try a different name or increase distance</p>
                            </div>
                        )}

                        {!loading && products.length > 0 && (
                            <>
                                <div className="flex items-center justify-between mb-4">
                                    <p className="text-gray-500 text-sm">
                                        {products.length} result{products.length > 1 ? "s" : ""} for{" "}
                                        <span className="font-medium text-gray-700">"{query}"</span>
                                        {selectedDistance && (
                                            <span className="text-green-500"> within {distanceOptions.find(d => d.value === selectedDistance)?.label}</span>
                                        )}
                                    </p>
                                    <p className="text-gray-400 text-xs">Sorted by lowest price</p>
                                </div>
                                <div className="grid grid-cols-2 sm:grid-cols-3 md:grid-cols-4 lg:grid-cols-5 gap-4 mb-6">
                                    {products.map((product, index) => (
                                        <ProductCard key={product._id} product={product} index={index} />
                                    ))}
                                </div>
                                {searchHasMore && (
                                    <div className="text-center mb-10">
                                        <button
                                            onClick={loadMoreSearch}
                                            disabled={loadingMore}
                                            className="bg-white border border-gray-200 text-gray-600 px-8 py-2.5 rounded-xl hover:bg-gray-50 transition text-sm font-medium"
                                        >
                                            {loadingMore ? "Loading..." : "Load More"}
                                        </button>
                                    </div>
                                )}
                            </>
                        )}
                    </>
                )}

                {/* trending */}
                {!searched && trendingProducts.length > 0 && (
                    <div className="mb-10">
                        <div className="flex items-center justify-between mb-4">
                            <h2 className="text-lg font-bold text-gray-800">🔥 Trending</h2>
                            <span className="text-xs text-gray-400">Most viewed products</span>
                        </div>
                        <div className="grid grid-cols-2 sm:grid-cols-3 md:grid-cols-4 lg:grid-cols-5 gap-4">
                            {trendingProducts.map((product, index) => (
                                <ProductCard key={product._id} product={product} index={index} />
                            ))}
                        </div>
                    </div>
                )}

                {/* latest */}
                {!searched && latestProducts.length > 0 && (
                    <div>
                        <div className="flex items-center justify-between mb-4">
                            <h2 className="text-lg font-bold text-gray-800">🆕 Latest Products</h2>
                            <span className="text-xs text-gray-400">Recently added</span>
                        </div>
                        <div className="grid grid-cols-2 sm:grid-cols-3 md:grid-cols-4 lg:grid-cols-5 gap-4">
                            {latestProducts.map((product, index) => (
                                <ProductCard key={product._id} product={product} index={index} />
                            ))}
                        </div>
                        {latestHasMore && (
                            <div className="text-center mt-6">
                                <button
                                    onClick={loadMoreLatest}
                                    disabled={loadingMore}
                                    className="bg-white border border-gray-200 text-gray-600 px-8 py-2.5 rounded-xl hover:bg-gray-50 transition text-sm font-medium"
                                >
                                    {loadingMore ? "Loading..." : "Load More"}
                                </button>
                            </div>
                        )}
                    </div>
                )}

                {!searched && latestProducts.length === 0 && trendingProducts.length === 0 && (
                    <div className="text-center py-16">
                        <p className="text-gray-300 text-6xl mb-4">🛒</p>
                        <p className="text-gray-400">No products available yet</p>
                    </div>
                )}
            </div>

            <Footer />
        </div>
    );
};

export default Home;