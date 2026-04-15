import { useState, useEffect, useRef } from "react";
import { useNavigate } from "react-router";
import { getSocket, ensureSocket, getSession, getClient } from "../services/nakama";

const Lobby = () => {
    const navigate = useNavigate();

    const [searching, setSearching] = useState(false);

    // ✅ Use refs to avoid stale state issues
    const ticketRef = useRef<any>(null);
    const isSearchingRef = useRef(false);
    const socketRef = useRef<any>(null);

    useEffect(() => {
        const setup = async () => {
            const socket = await ensureSocket();
            if (!socket) return;

            socketRef.current = socket;

            socket.onmatchmakermatched = async (matched: any) => {
                console.log("Match found!", matched);

                isSearchingRef.current = false;

                setSearching(false);
                ticketRef.current = null;

                try {
                    const match = await socket.joinMatch(undefined, matched.token);
                    console.log("Joined match:", match);

                    localStorage.setItem("matchId", match.match_id);

                    navigate("/game", { state: { matchId: match.match_id } });

                } catch (err) {
                    console.error("JOIN MATCH ERROR:", err);
                }
            };
        };

        setup();

        // ✅ Proper cleanup
        return () => {
            if (socketRef.current) {
                socketRef.current.onmatchmakermatched = () => { };
            }
        };
    }, [navigate]);

    const findMatch = async () => {
        const socket = await ensureSocket();
        if (!socket) return;

        const client = getClient();
        const session = getSession();

        if (!session) {
            console.error("No session found");
            return;
        }

        try {
            setSearching(true);
            isSearchingRef.current = true;

            const res = await socket.addMatchmaker("*", 2, 2);
            ticketRef.current = res;

            console.log("Searching for match...");

            // 👇 KEEP THIS (matchmaker result handler)
            socket.onmatchmakermatched = async (matched: any) => {
                console.log("Match found!", matched);

                isSearchingRef.current = false;
                setSearching(false);
                ticketRef.current = null;

                try {
                    // ✅ STEP 1: Create authoritative match via RPC
                    const rpcRes = await client.rpc(session, "find_match", {});
                    console.log(rpcRes);
                    
                    const { matchId } = JSON.parse(rpcRes.payload);

                    console.log("Created authoritative match:", matchId);

                    // ✅ STEP 2: Join that match
                    const match = await socket.joinMatch(matchId);

                    console.log("Joined match:", match);

                    localStorage.setItem("matchId", match.match_id);

                    navigate("/game", { state: { matchId: match.match_id } });

                } catch (err) {
                    console.error("JOIN MATCH ERROR:", err);
                }
            };

            // ⏳ Timeout (unchanged)
            setTimeout(async () => {
                if (!isSearchingRef.current || !ticketRef.current) return;

                console.log("No match found, cancelling...");

                await socket.removeMatchmaker(ticketRef.current.ticket);

                setSearching(false);
                ticketRef.current = null;
                isSearchingRef.current = false;

                alert("No players found after 30 seconds.");
            }, 30000);

        } catch (err) {
            console.error("Matchmaking error:", err);
            setSearching(false);
        }
    };

    const cancelMatch = async () => {
        const socket = getSocket();
        if (!socket || !ticketRef.current) return;

        await socket.removeMatchmaker(ticketRef.current.ticket);

        setSearching(false);
        ticketRef.current = null;
        isSearchingRef.current = false;
    };

    return (
        <>
            <h4>Welcome, Player</h4>

            {!searching ? (
                <button onClick={findMatch}>Find Match</button>
            ) : (
                <>
                    <p>🔍 Searching for player... (30s timeout)</p>
                    <button onClick={cancelMatch}>Cancel</button>
                </>
            )}

            <h4>📊 Your Stats</h4>
            <p>Wins: X | Loss: Y | Draw: Z</p>
        </>
    );
};

export default Lobby;