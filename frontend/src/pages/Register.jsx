import { useState } from "react";
import { useAuth } from "../context/AuthContext";
import { useNavigate, Link } from "react-router-dom";
import api from "../utils/api";
import Navbar from "../components/Navbar";

const validatePassword = (pwd) => {
    const checks = {
        length: pwd.length >= 8,
        number: /\d/.test(pwd),
        uppercase: /[A-Z]/.test(pwd),
    };
    return checks;
};

const validateFullName = (name) => {
    const parts = name.trim().split(" ").filter((p) => p.length > 0);
    return parts.length >= 2 && /^[a-zA-Z\s]+$/.test(name);
};

const Register = () => {
    const { register } = useAuth();
    const navigate = useNavigate();
    const [step, setStep] = useState(1);
    const [form, setForm] = useState({
        name: "", email: "", password: "", role: "user",
        shopName: "", shopAddress: "", phone: "",
    });
    const [coordinates, setCoordinates] = useState(null);
    const [locationStatus, setLocationStatus] = useState("idle");
    const [error, setError] = useState("");
    const [loading, setLoading] = useState(false);

    const handleChange = (e) => {
        setForm({ ...form, [e.target.name]: e.target.value });
    };

    const handlePhoneChange = (e) => {
        const val = e.target.value.replace(/\D/g, "").slice(0, 10);
        setForm({ ...form, phone: val });
    };

    const handleStep1 = (e) => {
        e.preventDefault();

        if (!validateFullName(form.name)) {
            setError("Please enter your full name (first and last name).");
            return;
        }

        const checks = validatePassword(form.password);
        if (!checks.length || !checks.number || !checks.uppercase) {
            setError("Password must be at least 8 characters with 1 uppercase letter and 1 number.");
            return;
        }

        setError("");
        if (form.role === "vendor") {
            setStep(2);
        } else {
            handleSubmit();
        }
    };

    const fetchLocation = async () => {
        setLocationStatus("fetching");
        if (!navigator.geolocation) {
            setLocationStatus("denied");
            return;
        }
        navigator.geolocation.getCurrentPosition(
            async (pos) => {
                const { latitude, longitude } = pos.coords;
                setCoordinates([longitude, latitude]);

                // reverse geocoding — address auto fill
                try {
                    const res = await fetch(
                        `https://nominatim.openstreetmap.org/reverse?lat=${latitude}&lon=${longitude}&format=json`
                    );
                    const data = await res.json();
                    const addr = data.address;
                    const readable = [
                        addr.road || addr.neighbourhood,
                        addr.suburb || addr.village,
                        addr.city || addr.town || addr.district,
                        addr.state,
                    ]
                        .filter(Boolean)
                        .join(", ");

                    setForm((prev) => ({ ...prev, shopAddress: readable }));
                } catch {
                    // address fill nahi hua — manually bharein
                }

                setLocationStatus("allowed");
            },
            () => {
                setLocationStatus("denied");
            }
        );
    };

    const handleSubmit = async () => {
        if (form.role === "vendor" && !coordinates) {
            setError("Please allow location access to register as vendor.");
            return;
        }

        setLoading(true);
        setError("");
        try {
            const user = await register(form.name, form.email, form.password, form.role);

            if (form.role === "vendor") {
                await api.post("/vendor/register", {
                    shopName: form.shopName,
                    shopAddress: form.shopAddress,
                    phone: form.phone,
                    coordinates,
                });
            }

            if (user.role === "vendor") navigate("/vendor/dashboard");
            else navigate("/dashboard");
            } catch (err) {
            const msg = err?.response?.data?.msg;
            if (msg === "Email already registered") {
                setError("This email is already registered. Please login!");
            } else if (msg === "Phone number already registered") {
                setError("This phone number is already registered!");
            } else {
                setError(msg || "Registration failed. Try again!");
            }
        }
        setLoading(false);
    };

    const pwdChecks = validatePassword(form.password);
    const isPasswordValid = pwdChecks.length && pwdChecks.number && pwdChecks.uppercase;
    const isNameValid = validateFullName(form.name);

    return (
        <div className="min-h-screen bg-gray-50">
            <Navbar />
            <div className="flex items-center justify-center px-4 py-16">
                <div className="bg-white p-8 rounded-2xl shadow-sm border border-gray-100 w-full max-w-md">

                    {form.role === "vendor" && (
                        <div className="flex items-center gap-2 mb-6">
                            <div className={`w-8 h-8 rounded-full flex items-center justify-center text-sm font-bold ${
                                step >= 1 ? "bg-green-500 text-white" : "bg-gray-100 text-gray-400"
                            }`}>1</div>
                            <div className={`flex-1 h-1 rounded ${step >= 2 ? "bg-green-500" : "bg-gray-100"}`} />
                            <div className={`w-8 h-8 rounded-full flex items-center justify-center text-sm font-bold ${
                                step >= 2 ? "bg-green-500 text-white" : "bg-gray-100 text-gray-400"
                            }`}>2</div>
                        </div>
                    )}

                    <h2 className="text-2xl font-bold text-gray-900 mb-1">
                        {step === 1 ? "Create Account" : "Shop Details"}
                    </h2>
                    <p className="text-gray-400 text-sm mb-6">
                        {step === 1 ? "Join NearPrice today" : "Tell us about your shop"}
                    </p>

                    {error && (
                        <p className="text-red-500 text-sm mb-4 bg-red-50 px-3 py-2 rounded-lg">
                            {error}
                        </p>
                    )}

                    {/* step 1 */}
                    {step === 1 && (
                        <form onSubmit={handleStep1} className="space-y-4">

                            {/* full name */}
                            <div>
                                <input
                                    type="text"
                                    name="name"
                                    placeholder="Full Name"
                                    value={form.name}
                                    onChange={handleChange}
                                    className="w-full border border-gray-200 px-4 py-3 rounded-xl focus:outline-none focus:ring-2 focus:ring-green-400 text-sm"
                                    required
                                />
                                {form.name.length > 0 && !isNameValid && (
                                    <p className="text-red-400 text-xs mt-1">
                                        Please enter first and last name
                                    </p>
                                )}
                                {form.name.length > 0 && isNameValid && (
                                    <p className="text-green-500 text-xs mt-1">✓ Valid name</p>
                                )}
                            </div>

                            <input
                                type="email"
                                name="email"
                                placeholder="Email Address"
                                value={form.email}
                                onChange={handleChange}
                                className="w-full border border-gray-200 px-4 py-3 rounded-xl focus:outline-none focus:ring-2 focus:ring-green-400 text-sm"
                                required
                            />

                            {/* password with strength */}
                            <div>
                                <input
                                    type="password"
                                    name="password"
                                    placeholder="Password"
                                    value={form.password}
                                    onChange={handleChange}
                                    className="w-full border border-gray-200 px-4 py-3 rounded-xl focus:outline-none focus:ring-2 focus:ring-green-400 text-sm"
                                    required
                                />
                                {form.password.length > 0 && (
                                    <div className="mt-2 space-y-1">
                                        <p className={`text-xs ${pwdChecks.length ? "text-green-500" : "text-red-400"}`}>
                                            {pwdChecks.length ? "✓" : "✕"} At least 8 characters
                                        </p>
                                        <p className={`text-xs ${pwdChecks.uppercase ? "text-green-500" : "text-red-400"}`}>
                                            {pwdChecks.uppercase ? "✓" : "✕"} At least 1 uppercase letter
                                        </p>
                                        <p className={`text-xs ${pwdChecks.number ? "text-green-500" : "text-red-400"}`}>
                                            {pwdChecks.number ? "✓" : "✕"} At least 1 number
                                        </p>
                                    </div>
                                )}
                            </div>

                            {/* phone for user */}
                            {form.role === "user" && (
                                <div>
                                    <input
                                        type="tel"
                                        name="phone"
                                        placeholder="Phone Number (10 digits)"
                                        value={form.phone}
                                        onChange={handlePhoneChange}
                                        className="w-full border border-gray-200 px-4 py-3 rounded-xl focus:outline-none focus:ring-2 focus:ring-green-400 text-sm"
                                    />
                                    {form.phone.length > 0 && form.phone.length < 10 && (
                                        <p className="text-red-400 text-xs mt-1">
                                            {10 - form.phone.length} more digit{10 - form.phone.length > 1 ? "s" : ""} needed
                                        </p>
                                    )}
                                    {form.phone.length === 10 && (
                                        <p className="text-green-500 text-xs mt-1">✓ Valid number</p>
                                    )}
                                </div>
                            )}

                            <div className="grid grid-cols-2 gap-3">
                                <button
                                    type="button"
                                    onClick={() => setForm({ ...form, role: "user" })}
                                    className={`py-3 rounded-xl border text-sm font-medium transition ${
                                        form.role === "user"
                                            ? "bg-green-500 text-white border-green-500"
                                            : "bg-white text-gray-500 border-gray-200 hover:border-green-400"
                                    }`}
                                >
                                    👤 I'm a User
                                </button>
                                <button
                                    type="button"
                                    onClick={() => setForm({ ...form, role: "vendor" })}
                                    className={`py-3 rounded-xl border text-sm font-medium transition ${
                                        form.role === "vendor"
                                            ? "bg-green-500 text-white border-green-500"
                                            : "bg-white text-gray-500 border-gray-200 hover:border-green-400"
                                    }`}
                                >
                                    🏪 I'm a Vendor
                                </button>
                            </div>

                            <button
                                type="submit"
                                disabled={
                                    loading ||
                                    !isNameValid ||
                                    !isPasswordValid ||
                                    (form.role === "user" && form.phone.length > 0 && form.phone.length < 10)
                                }
                                className="w-full bg-green-500 text-white py-3 rounded-xl hover:bg-green-600 transition font-medium text-sm disabled:opacity-50"
                            >
                                {form.role === "vendor" ? "Next →" : loading ? "Creating..." : "Create Account"}
                            </button>
                        </form>
                    )}

                    {/* step 2 — vendor */}
                    {step === 2 && (
                        <form onSubmit={(e) => { e.preventDefault(); handleSubmit(); }} className="space-y-4">
                            <input
                                type="text"
                                name="shopName"
                                placeholder="Shop Name"
                                value={form.shopName}
                                onChange={handleChange}
                                className="w-full border border-gray-200 px-4 py-3 rounded-xl focus:outline-none focus:ring-2 focus:ring-green-400 text-sm"
                                required
                            />

                            {/* phone for vendor */}
                            <div>
                                <input
                                    type="tel"
                                    name="phone"
                                    placeholder="Phone Number (10 digits)"
                                    value={form.phone}
                                    onChange={handlePhoneChange}
                                    className="w-full border border-gray-200 px-4 py-3 rounded-xl focus:outline-none focus:ring-2 focus:ring-green-400 text-sm"
                                    required
                                />
                                {form.phone.length > 0 && form.phone.length < 10 && (
                                    <p className="text-red-400 text-xs mt-1">
                                        {10 - form.phone.length} more digit{10 - form.phone.length > 1 ? "s" : ""} needed
                                    </p>
                                )}
                                {form.phone.length === 10 && (
                                    <p className="text-green-500 text-xs mt-1">✓ Valid number</p>
                                )}
                            </div>

                            {/* location — auto fills address */}
                            <div className={`rounded-xl px-4 py-3 border ${
                                locationStatus === "allowed"
                                    ? "bg-green-50 border-green-200"
                                    : locationStatus === "denied"
                                    ? "bg-red-50 border-red-200"
                                    : "bg-gray-50 border-gray-200"
                            }`}>
                                {locationStatus === "idle" && (
                                    <div>
                                        <p className="text-gray-500 text-sm mb-2">
                                            📍 Shop location required for distance search
                                        </p>
                                        <button
                                            type="button"
                                            onClick={fetchLocation}
                                            className="w-full bg-green-500 text-white py-2 rounded-lg text-sm font-medium hover:bg-green-600 transition"
                                        >
                                            📍 Use My Current Location
                                        </button>
                                    </div>
                                )}
                                {locationStatus === "fetching" && (
                                    <p className="text-gray-400 text-sm text-center">
                                        📍 Getting your location...
                                    </p>
                                )}
                                {locationStatus === "allowed" && (
                                    <div>
                                        <p className="text-green-600 text-sm font-medium mb-1">
                                            ✓ Location captured
                                        </p>
                                        {form.shopAddress && (
                                            <p className="text-gray-500 text-xs">{form.shopAddress}</p>
                                        )}
                                        <button
                                            type="button"
                                            onClick={fetchLocation}
                                            className="text-green-500 text-xs underline mt-1"
                                        >
                                            Retake location
                                        </button>
                                    </div>
                                )}
                                {locationStatus === "denied" && (
                                    <div>
                                        <p className="text-red-500 text-sm mb-2">
                                            ✕ Location access denied
                                        </p>
                                        <button
                                            type="button"
                                            onClick={fetchLocation}
                                            className="w-full bg-red-500 text-white py-2 rounded-lg text-sm font-medium hover:bg-red-600 transition"
                                        >
                                            Try Again
                                        </button>
                                    </div>
                                )}
                            </div>

                            {locationStatus !== "allowed" && (
                                <p className="text-red-400 text-xs -mt-2">
                                    * Location is required to register as vendor
                                </p>
                            )}

                            <div className="flex gap-3">
                                <button
                                    type="button"
                                    onClick={() => setStep(1)}
                                    className="flex-1 py-3 rounded-xl border border-gray-200 text-gray-500 text-sm font-medium hover:bg-gray-50"
                                >
                                    Back
                                </button>
                                <button
                                    type="submit"
                                    disabled={
                                        loading ||
                                        locationStatus !== "allowed" ||
                                        form.phone.length !== 10
                                    }
                                    className="flex-1 bg-green-500 text-white py-3 rounded-xl hover:bg-green-600 transition font-medium text-sm disabled:opacity-50"
                                >
                                    {loading ? "Creating..." : "Create Account"}
                                </button>
                            </div>
                        </form>
                    )}

                    <p className="text-center text-sm mt-4 text-gray-400">
                        Already have an account?{" "}
                        <Link to="/login" className="text-green-500 hover:underline font-medium">
                            Login
                        </Link>
                    </p>
                </div>
            </div>
        </div>
    );
};

export default Register;