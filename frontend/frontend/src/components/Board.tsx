type BoardProps = {
    board: (string | null)[];
    onCellClick: (index: number) => void;
};

const Board = ({ board, onCellClick }: BoardProps) => {
    return (
        <div style={styles.board}>
            {board.map((cell, index) => {
                const row = Math.floor(index / 3);
                const col = index % 3;

                return (
                    <div
                        key={index}
                        style={{
                            ...styles.cell,
                            borderRight: col !== 2 ? "2px solid black" : "none",
                            borderBottom: row !== 2 ? "2px solid black" : "none",
                        }}
                        onClick={() => onCellClick(index)}
                    >
                        {cell}
                    </div>
                );
            })}
        </div>
    );
};

const styles = {
    board: {
        display: "grid",
        gridTemplateColumns: "repeat(3, 100px)",
    },
    cell: {
        width: "100px",
        height: "100px",
        display: "flex",
        alignItems: "center",
        justifyContent: "center",
        fontSize: "2rem",
        cursor: "pointer",
    },
};

export default Board;