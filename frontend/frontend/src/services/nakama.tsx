import { Client, Session } from "@heroiclabs/nakama-js";
import type { Socket } from "@heroiclabs/nakama-js";

const client = new Client("defaultkey", "127.0.0.1", "7350", false);

let socket: Socket | null = null;

// Helper to convert username → email
const toEmail = (username: string) => `${username}@game.com`;

// LOGIN
export const login = async (
    username: string,
    password: string
): Promise<Session> => {
    try {
        const session = await client.authenticateEmail(
            toEmail(username),
            password,
            false // ❗ only login, do NOT create
        );

        // store session
        localStorage.setItem("session", JSON.stringify(session));

        return session;
    } catch (err: any) {
        throw new Error("Invalid username or password");
    }
};

// REGISTER
export const register = async (
    username: string,
    password: string
): Promise<Session> => {
    console.log(toEmail(username), password);

    try {
        const session = await client.authenticateEmail(
            toEmail(username),
            password,
        );

        // optional: set display name
        await client.updateAccount(session, {
            display_name: username,
        });

        // store session
        localStorage.setItem("session", JSON.stringify(session));

        return session;
    } catch (err: any) {
        console.log("Error:", err);

        throw new Error("Registration failed");
    }
};

// FETCH SOCKET CONNECTION
export const ensureSocket = async () => {
    if (socket) return socket;

    const session = getSession();
    if (!session) return null;

    socket = client.createSocket();
    await socket.connect(session, true);

    console.log("Socket connected");

    return socket;
};

// CHECK IF AUTHENTICATED
export const isAuthenticated = async () => {
    let session = getSession();

    if (!session) return false;

    console.log(session);
    console.log(session.isexpired(Date.now() / 1000));

    // ✅ If NOT expired → valid
    if (!session.isexpired(Date.now() / 1000)) {
        return true;
    }

    // 🔄 Try refresh
    try {
        const newSession = await client.sessionRefresh(session);

        localStorage.setItem("session", JSON.stringify({
            token: newSession.token,
            refresh_token: newSession.refresh_token
        }));

        return true;
    } catch (e) {
        console.info("Session expired and refresh failed");

        localStorage.removeItem("session");
        return false;
    }
};

// GET ACCOUNT INFO
export const getAccountInfo = async (session: any) => {
    const account = await client.getAccount(session);

    console.log(account);

    return account;
};

// GET SESSION
export const getSession = (): Session | null => {
    const data = localStorage.getItem("session");
    if (!data) return null;

    const parsed = JSON.parse(data);

    if (!parsed.token || !parsed.refresh_token) {
        console.error("Invalid session data");
        return null;
    }

    return Session.restore(parsed.token, parsed.refresh_token);
};

// GET SOCKET
export const getSocket = (): Socket | null => {
    return socket;
};

// LOGOUT
export const logout = () => {
    localStorage.removeItem("session");
    socket = null;
};

export const getClient = () => client;