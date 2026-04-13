import { Client } from "@heroiclabs/nakama-js";
import type { Session, Socket } from "@heroiclabs/nakama-js";

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

        // connect socket
        socket = client.createSocket();
        await socket.connect(session, true);

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

        // connect socket
        socket = client.createSocket();
        await socket.connect(session, true);

        return session;
    } catch (err: any) {
        console.log("Error:", err);

        throw new Error("Registration failed");
    }
};

// CHECK IF AUTHENTICATED
export const isAuthenticated = () => {
    const session = getSession();

    if (!session) return false;

    const isValid = session.expires_at! * 1000 > Date.now();

    if (!isValid) {
        localStorage.removeItem("session");
    }

    return isValid;
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
    return data ? (JSON.parse(data) as Session) : null;
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