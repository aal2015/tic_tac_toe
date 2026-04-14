import { useState, useEffect } from "react";
import { useNavigate } from "react-router";
import { getSocket, ensureSocket } from "../services/nakama";

const Lobby = () => {
    const navigate = useNavigate();

    const [searching, setSearching] = useState(false);
    const [ticket, setTicket] = useState<any>(null);

    useEffect(() => {
        const setup = async () => {
            const socket = await ensureSocket();
            if (!socket) return;

            const handler = async (matched: any) => {
                console.log("Match found!", matched);

                setSearching(false);
                setTicket(null);

                const match = await socket.joinMatch(matched.match_id);

                console.log("Joined match:", match);

                navigate("/game", { state: { matchId: match.match_id } });
            };

            socket.onmatchmakermatched = handler;

            // ✅ cleanup (important)
            return () => {
                if (socket.onmatchmakermatched === handler) {
                    socket.onmatchmakermatched = () => { };
                }
            };
        };

        setup();
    }, [navigate]);

    const findMatch = async () => {
        const socket = await ensureSocket();
        if (!socket) return;

        try {
            setSearching(true);

            const res = await socket.addMatchmaker("*", 2, 2);
            setTicket(res);

            console.log("Searching for match...");

            // ⏳ Timeout (FIXED)
            setTimeout(async () => {
                if (res) {
                    console.log("No match found, cancelling...");

                    await socket.removeMatchmaker(res.ticket);

                    setSearching(false);
                    setTicket(null);

                    alert("No players found. Try again.");
                }
            }, 10000);

        } catch (err) {
            console.error("Matchmaking error:", err);
            setSearching(false);
        }
    };

    const cancelMatch = async () => {
        const socket = getSocket();
        if (!socket || !ticket) return;

        await socket.removeMatchmaker(ticket.ticket);

        setSearching(false);
        setTicket(null);
    };

    return (
        <>
            <h4>Welcome, Player</h4>

            {!searching ? (
                <button onClick={findMatch}>Find Match</button>
            ) : (
                <>
                    <p>🔍 Searching for player...</p>
                    <button onClick={cancelMatch}>Cancel</button>
                </>
            )}

            <h4>📊 Your Stats</h4>
            <p>Wins: X | Loss: Y | Draw: Z</p>
        </>
    );
};

export default Lobby;