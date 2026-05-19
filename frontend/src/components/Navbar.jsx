import { useState, useEffect } from "react";
import { useNavigate } from "react-router-dom";
import { useAuth } from "../context/AuthContext";
import Toast from "./Toast";

const Navbar = () => {
    const { user, logout } = useAuth();
    const navigate = useNavigate();
    const [welcome, setWelcome] = useState(null);

    useEffect(() => {
        // check for welcome message after login
        const msg = localStorage.getItem("welcomeMsg");
        if (msg) {
            setWelcome(msg);
            localStorage.removeItem("welcomeMsg");
        }
    }, []);

    return (
        <>
            {/* welcome toast */}
            {welcome && (
                <Toast
                    message={welcome}
                    type="success"
                    onClose={() => setWelcome(null)}
                />
            )}

            <nav className="bg-white border-b border-gray-100 px-6 py-4 flex justify-between items-center sticky top-0 z-40 shadow-sm">
                <div
                    onClick={() => navigate("/")}
                    className="flex items-center gap-2 cursor-pointer"
                >
                    {/* pin icon with rupee */}
                    <svg width="28" height="34" viewBox="0 0 28 34" fill="none">
                        <path d="M14 0C6.27 0 0 6.27 0 14C0 21.73 14 34 14 34C14 34 28 21.73 28 14C28 6.27 21.73 0 14 0Z" fill="#22c55e"/>
                        <circle cx="14" cy="14" r="8" fill="white"/>
                        <text x="14" y="18" textAnchor="middle" fontSize="10" fontWeight="700" fill="#22c55e" fontFamily="sans-serif">₹</text>
                    </svg>
                    <span className="text-2xl font-extrabold tracking-tight">
                        <span className="text-green-500">Near</span>
                        <span className="text-gray-800">Price</span>
                    </span>
                </div>

                <div className="flex items-center gap-4">
                    {user ? (
                        <>
                            {/* user info badge */}
                            <div className="hidden md:flex items-center gap-2 bg-gray-50 border border-gray-200 px-3 py-1.5 rounded-full">
                                <div className="w-7 h-7 rounded-full bg-green-500 flex items-center justify-center text-white text-xs font-bold">
                                    {user.name?.charAt(0).toUpperCase()}
                                </div>
                                <span className="text-sm font-medium text-gray-700">{user.name}</span>
                                <span className={`text-xs px-2 py-0.5 rounded-full font-medium ${
                                    user.role === "admin"
                                        ? "bg-red-100 text-red-600"
                                        : user.role === "vendor"
                                        ? "bg-blue-100 text-blue-600"
                                        : "bg-green-100 text-green-600"
                                }`}>
                                    {user.role}
                                </span>
                            </div>

                            {user.role === "user" && !window.location.pathname.includes("/dashboard") && (
                                <button
                                    onClick={() => navigate("/dashboard")}
                                    className="text-sm text-gray-600 hover:text-green-600 font-medium transition-colors duration-200"
                                >
                                    Dashboard
                                </button>
                            )}

                            {user.role === "vendor" && !window.location.pathname.includes("/vendor") && (
                                <button
                                    onClick={() => navigate("/vendor/dashboard")}
                                    className="text-sm text-gray-600 hover:text-green-600 font-medium transition-colors duration-200"
                                >
                                    My Shop
                                </button>
                            )}

                            {user.role === "admin" && !window.location.pathname.includes("/admin") && (
                                <button
                                    onClick={() => navigate("/admin/dashboard")}
                                    className="text-sm bg-red-50 text-red-500 px-3 py-1.5 rounded-lg hover:bg-red-100 font-medium transition-colors duration-200"
                                >
                                    Admin Panel
                                </button>
                            )}

                            <button
                                onClick={() => { logout(); navigate("/"); }}
                                className="text-sm bg-gray-100 text-gray-600 px-4 py-1.5 rounded-lg hover:bg-red-50 hover:text-red-500 font-medium transition-all duration-200"
                            >
                                Logout
                            </button>
                        </>
                    ) : (
                        <>
                            <button
                                onClick={() => navigate("/login")}
                                className="text-sm text-gray-600 hover:text-green-600 font-medium transition-colors duration-200"
                            >
                                Login
                            </button>
                            <button
                                onClick={() => navigate("/register")}
                                className="text-sm bg-green-500 text-white px-4 py-1.5 rounded-lg hover:bg-green-600 font-medium transition-colors duration-200 shadow-sm"
                            >
                                Register
                            </button>
                        </>
                    )}
                </div>
            </nav>
        </>
    );
};

export default Navbar;