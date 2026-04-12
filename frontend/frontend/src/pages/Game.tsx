import { useState } from 'react'
import Board from "../components/Board";

const Game = () => {
    const [board, setBoard] = useState<(string | null)[]>(Array(9).fill(null));

    const handleClick = (index: number) => {
        console.log(index);
    };

    return (<>
        <Board board={board} onCellClick={handleClick} />
    </>)
}

export default Game;