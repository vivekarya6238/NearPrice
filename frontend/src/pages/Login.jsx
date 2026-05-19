import { useState } from "react";
import { useAuth } from "../context/AuthContext";
import { useNavigate, Link } from "react-router-dom";

const Login = () => {
    const { login } = useAuth();
    const navigate = useNavigate();
    const [form, setForm] = useState({ email: "", password: "" });
    const [error, setError] = useState("");

    const handleChange = (e) => {
        setForm({ ...form, [e.target.name]: e.target.value });
    };

    const handleSubmit = async (e) => {
    e.preventDefault();
    try {
        const user = await login(form.email, form.password);

        // welcome message logic
        const today = new Date().toDateString();
        const lastLogin = localStorage.getItem(`lastLogin_${user.id}`);

        if (lastLogin === today) {
            localStorage.setItem("welcomeMsg", `Welcome back, ${user.name}! 👋`);
        } else {
            localStorage.setItem("welcomeMsg", `Welcome, ${user.name}! 🎉`);
            localStorage.setItem(`lastLogin_${user.id}`, today);
        }

        if (user.role === "admin") navigate("/admin/dashboard");
        else if (user.role === "vendor") navigate("/vendor/dashboard");
        else navigate("/dashboard");
            } catch (err) {
                setError("Invalid email or password");
            }
        };

    return (
        <div className="min-h-screen flex items-center justify-center bg-gray-50">
            <div className="bg-white p-8 rounded-xl shadow-md w-full max-w-md">
                <h2 className="text-2xl font-bold text-center text-green-600 mb-6">
                    Login to NearPrice
                </h2>
                {error && <p className="text-red-500 text-sm mb-4">{error}</p>}
                <form onSubmit={handleSubmit} className="space-y-4">
                    <input
                        type="email"
                        name="email"
                        placeholder="Email"
                        value={form.email}
                        onChange={handleChange}
                        className="w-full border px-4 py-2 rounded-lg focus:outline-none focus:ring-2 focus:ring-green-400"
                        required
                    />
                    <input
                        type="password"
                        name="password"
                        placeholder="Password"
                        value={form.password}
                        onChange={handleChange}
                        className="w-full border px-4 py-2 rounded-lg focus:outline-none focus:ring-2 focus:ring-green-400"
                        required
                    />
                    <button
                        type="submit"
                        className="w-full bg-green-500 text-white py-2 rounded-lg hover:bg-green-600 transition"
                    >
                        Login
                    </button>
                </form>
                <p className="text-center text-sm mt-4">
                    Don't have an account?{" "}
                    <Link to="/register" className="text-green-500 hover:underline">
                        Register
                    </Link>
                </p>
            </div>
        </div>
    );
};

export default Login;