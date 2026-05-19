import { useEffect, useState } from "react";

const Toast = ({ message, type = "success", onClose }) => {
    const [visible, setVisible] = useState(false);

    useEffect(() => {
        setTimeout(() => setVisible(true), 10);
        const timer = setTimeout(() => {
            setVisible(false);
            setTimeout(onClose, 300);
        }, 3000);
        return () => clearTimeout(timer);
    }, [onClose]);

    return (
        <div className={`fixed top-20 left-1/2 -translate-x-1/2 z-50 flex items-center gap-3 px-6 py-3 rounded-full shadow-xl text-white text-sm font-medium transition-all duration-300 ${
            visible ? "opacity-100 translate-y-0" : "opacity-0 translate-y-4"
        } ${type === "success" ? "bg-green-500" : "bg-red-500"}`}>
            <span className="text-base">{type === "success" ? "✓" : "✕"}</span>
            <span>{message}</span>
        </div>
    );
};

export default Toast;