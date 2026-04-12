import { useState } from 'react'
import Board from "../components/Board";

type Player = "X" | "O";

export const checkWinner = (board: (Player | null)[]): Player | null => {
  const wins = [
    [0,1,2],[3,4,5],[6,7,8],
    [0,3,6],[1,4,7],[2,5,8],
    [0,4,8],[2,4,6],
  ];

  for (const [a, b, c] of wins) {
    if (board[a] && board[a] === board[b] && board[a] === board[c]) {
      return board[a];
    }
  }

  return null;
};

const Game = () => {
    const [board, setBoard] = useState<(Player | null)[]>(Array(9).fill(null));
    const [winner, setWinner] = useState<Player | null>(null);

    const handleClick = (index: number) => {
        // ❌ Invalid move checks
        if (board[index] !== null || winner) {
            console.log("Invalid move");
            return;
        }

        // ✅ Simulate backend update (temporary)
        const newBoard = [...board];
        newBoard[index] = "X"; // placeholder (backend will decide later)

        const win = checkWinner(newBoard);

        setBoard(newBoard);

        if (win) {
            setWinner(win);
        }

        // 🔜 Later replace with:
        // socket.sendMatchState(matchId, 1, JSON.stringify({ position: index }));
    };

    return (<>
        <Board board={board} onCellClick={handleClick} />
    </>)
}

export default Game;