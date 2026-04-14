import { useState, useEffect, useRef } from "react";
import { useNavigate } from "react-router";
import { getSocket, ensureSocket } from "../services/nakama";

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

        // ✅ Stop timeout logic
        isSearchingRef.current = false;

        setSearching(false);
        ticketRef.current = null;

        const match = await socket.joinMatch(matched.match_id);

        console.log("Joined match:", match);

        navigate("/game", { state: { matchId: match.match_id } });
      };
    };

    setup();

    // ✅ Proper cleanup
    return () => {
      if (socketRef.current) {
        socketRef.current.onmatchmakermatched = () => {};
      }
    };
  }, [navigate]);

  const findMatch = async () => {
    const socket = await ensureSocket();
    if (!socket) return;

    try {
      setSearching(true);
      isSearchingRef.current = true;

      const res = await socket.addMatchmaker("*", 2, 2);
      ticketRef.current = res;

      console.log("Searching for match...");

      // ⏳ Timeout (30 sec)
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