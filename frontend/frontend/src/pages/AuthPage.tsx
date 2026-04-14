import { useState } from "react";
import { useNavigate } from "react-router";
import { login, register } from "../services/nakama";

type Mode = "login" | "register";

const AuthPage = () => {
    const [mode, setMode] = useState<Mode>("login");
    const [username, setUsername] = useState("");
    const [password, setPassword] = useState("");
    const [error, setError] = useState("");

    let navigate = useNavigate();

    const validate = () => {
        if (!username.trim()) return "Username is required";
        if (password.length < 8) return "Password must be at least 4 characters";
        return "";
    };

    const handleSubmit = async () => {
        const validationError = validate();

        if (validationError) {
            setError(validationError);
            return;
        }

        try {
            if (mode === "login") {
                await login(username, password);
                console.log("Login:", username);
            } else {
                await register(username, password);
                console.log("Register:", username);
            }

            navigate("/lobby");
        } catch (err) {
            console.log(err);
            setError("Something went wrong");
        }
    };

    return (<>
        <h2>{mode === "login" ? "Login" : "Register"}</h2>

        <input placeholder="Username" onChange={(e) => setUsername(e.target.value)} />
        <input type="password" placeholder="Password" onChange={(e) => setPassword(e.target.value)} />

        {error && <p style={{ color: "red" }}>{error}</p>}

        <button onClick={handleSubmit}>
            {mode === "login" ? "Login" : "Register"}
        </button>

        <p>
            {mode === "login" ? "Don't have an account?" : "Already have an account?"}
        </p>

        <button
            onClick={() => {
                setMode(mode === "login" ? "register" : "login");
                setError("");
            }}
        >
            Switch to {mode === "login" ? "Register" : "Login"}
        </button>
    </>);
}

export default AuthPage