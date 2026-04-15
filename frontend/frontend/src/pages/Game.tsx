import { useEffect, useState } from "react";
import { useLocation, useNavigate } from "react-router";
import { ensureSocket } from "../services/nakama";
import Board from "../components/Board";

type Player = "X" | "O";

const OP_CODE_START = 1;
const OP_CODE_UPDATE = 2;
const OP_CODE_END = 3;
const OP_CODE_MOVE = 4;

const mapBoard = (board: number[]): (Player | null)[] => {
  return board.map((cell) =>
    cell === 1 ? "X" : cell === 2 ? "O" : null
  );
};

const Game = () => {
  const location = useLocation();
  const navigate = useNavigate();

  const [board, setBoard] = useState<(Player | null)[]>(Array(9).fill(null));
  const [winner, setWinner] = useState<Player | null>(null);
  const [myMark, setMyMark] = useState<Player | null>(null);
  const [turn, setTurn] = useState<number>(1);

  const matchId =
    location.state?.matchId || localStorage.getItem("matchId");

  useEffect(() => {
    if (!matchId) {
      console.error("No matchId found");
      navigate("/");
      return;
    }

    const setup = async () => {
      const socket = await ensureSocket();
      if (!socket) return;

      socket.onmatchdata = (msg: any) => {
        const data = JSON.parse(
          new TextDecoder().decode(msg.data)
        );

        console.log("Received:", msg.opCode, data);

        switch (msg.opCode) {
          case OP_CODE_START:
            setBoard(mapBoard(data.board));
            setTurn(data.turn);

            const userId = socket.session.user_id;
            const mark = data.marks[userId];

            setMyMark(mark === 1 ? "X" : "O");
            console.log("My mark:", mark === 1 ? "X" : "O");
            break;

          case OP_CODE_UPDATE:
            setBoard(mapBoard(data.board));
            setTurn(data.turn);
            break;

          case OP_CODE_END:
            setBoard(mapBoard(data.board));

            if (data.winner === 1) setWinner("X");
            else if (data.winner === 2) setWinner("O");
            else setWinner(null);

            console.log("Game Over. Winner:", data.winner);
            break;
        }
      };
    };

    setup();

    return () => {
      // cleanup
    };
  }, [matchId, navigate]);

  const handleClick = async (index: number) => {
    if (!matchId) return;

    const socket = await ensureSocket();
    if (!socket) return;

    // ✅ Light validation only
    if (board[index] !== null || winner) {
      console.log("Invalid move");
      return;
    }

    // Optional UX check
    if (
      (myMark === "X" && turn !== 1) ||
      (myMark === "O" && turn !== 2)
    ) {
      console.log("Not your turn");
      return;
    }

    try {
      socket.sendMatchState(
        matchId,
        OP_CODE_MOVE,
        new TextEncoder().encode(
          JSON.stringify({ position: index })
        )
      );
    } catch (err) {
      console.error("Failed to send move:", err);
    }

    console.log("Click");
  };

  const leaveGame = () => {
    localStorage.removeItem("matchId");
    navigate("/");
  };

  return (
    <div style={{ textAlign: "center" }}>
      <h2>🎮 Tic Tac Toe</h2>

      <p>Match ID: {matchId}</p>
      <p>Your Mark: {myMark || "Waiting..."}</p>
      <p>
        Turn:{" "}
        {turn === 1 ? "X" : "O"}
      </p>

      {winner && (
        <h3>
          {winner === "X" || winner === "O"
            ? `Winner: ${winner}`
            : "Draw!"}
        </h3>
      )}

      <Board board={board} onCellClick={handleClick} />

      <br />
      <button onClick={leaveGame}>Leave Game</button>
    </div>
  );
};

export default Game;