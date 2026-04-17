// ─── Opcodes ────────────────────────────────────────────────────────────────
// These numbers must match what your React client uses
const OP_CODE_START = 1;  // server → client: game started, marks assigned
const OP_CODE_UPDATE = 2;  // server → client: board state after a move
const OP_CODE_END = 3;  // server → client: game over with result
const OP_CODE_MOVE = 4;  // client → server: player submits a move

// ─── State shape ────────────────────────────────────────────────────────────
interface TicTacToeState {
    board: number[];                      // 9 cells: 0=empty, 1=playerOne, 2=playerTwo
    marks: { [userId: string]: number };  // userId → mark (1 or 2)
    presences: { [userId: string]: nkruntime.Presence };
    turn: number;       // whose turn: 1 or 2
    winner: number;     // 0=none, 1=p1 wins, 2=p2 wins, 3=draw
    gameOver: boolean;
}

// ─── Helper: check for a winner ─────────────────────────────────────────────
function checkWinner(board: number[]): number {
    const lines = [
        [0, 1, 2], [3, 4, 5], [6, 7, 8], // rows
        [0, 3, 6], [1, 4, 7], [2, 5, 8], // cols
        [0, 4, 8], [2, 4, 6],             // diagonals
    ];
    for (var i = 0; i < lines.length; i++) {
        var a = lines[i][0], b = lines[i][1], c = lines[i][2];
        if (board[a] !== 0 && board[a] === board[b] && board[a] === board[c]) {
            return board[a]; // 1 or 2
        }
    }
    // Check draw: all cells filled, no winner
    var filled = true;
    for (var j = 0; j < board.length; j++) {
        if (board[j] === 0) { filled = false; break; }
    }
    return filled ? 3 : 0;
}

// Call this whenever state changes to keep matchList accurate
function updateLabel(dispatcher: nkruntime.MatchDispatcher, s: TicTacToeState) {
    var label = JSON.stringify({
        open: !s.gameOver && Object.keys(s.presences).length < 2 ? 1 : 0,
    });
    dispatcher.matchLabelUpdate(label);
}

// ─── matchInit ──────────────────────────────────────────────────────────────
// Called once when the match is created via nk.matchCreate()
function matchInit(
    ctx: nkruntime.Context,
    logger: nkruntime.Logger,
    nk: nkruntime.Nakama,
    params: { [key: string]: string }
): { state: nkruntime.MatchState, tickRate: number, label: string } {
    var state: TicTacToeState = {
        board: [0, 0, 0, 0, 0, 0, 0, 0, 0],
        marks: {},
        presences: {},
        turn: 1,
        winner: 0,
        gameOver: false,
    };
    logger.info('Match created');
    return {
        state,
        tickRate: 1,       // 1 tick per second is enough for turn-based
        label: JSON.stringify({ open: 1 }),
    };
}

// ─── matchJoinAttempt ───────────────────────────────────────────────────────
// Called when a player tries to join. Return accept: false to reject them.
function matchJoinAttempt(
    ctx: nkruntime.Context,
    logger: nkruntime.Logger,
    nk: nkruntime.Nakama,
    dispatcher: nkruntime.MatchDispatcher,
    tick: number,
    state: nkruntime.MatchState,
    presence: nkruntime.Presence,
    metadata: { [key: string]: any }
): { state: nkruntime.MatchState, accept: boolean, rejectMessage?: string } | null {
    var s = state as TicTacToeState;
    var playerCount = Object.keys(s.marks).length;

    if (playerCount >= 2) {
        return { state: s, accept: false, rejectMessage: 'Match is full' };
    }
    return { state: s, accept: true };
}

// ─── matchJoin ──────────────────────────────────────────────────────────────
// Called after a player is accepted. Assign their mark and start if 2 players.
function matchJoin(
    ctx: nkruntime.Context,
    logger: nkruntime.Logger,
    nk: nkruntime.Nakama,
    dispatcher: nkruntime.MatchDispatcher,
    tick: number,
    state: nkruntime.MatchState,
    presences: nkruntime.Presence[]
): { state: nkruntime.MatchState } | null {
    var s = state as TicTacToeState;

    for (var i = 0; i < presences.length; i++) {
        var presence = presences[i];
        var playerCount = Object.keys(s.marks).length;
        s.marks[presence.userId] = playerCount === 0 ? 1 : 2;
        s.presences[presence.userId] = presence;
        logger.info('Player %s joined as mark %d', presence.userId, s.marks[presence.userId]);
    }

    if (Object.keys(s.presences).length === 2) {
        // Match is now full — close it from matchList
        updateLabel(dispatcher, s);

        dispatcher.broadcastMessage(OP_CODE_START, JSON.stringify({
            marks: s.marks,
            board: s.board,
            turn: s.turn,
        }));
        logger.info('Game started!');
    }

    return { state: s };
}

// ─── matchLeave ─────────────────────────────────────────────────────────────
function matchLeave(
    ctx: nkruntime.Context,
    logger: nkruntime.Logger,
    nk: nkruntime.Nakama,
    dispatcher: nkruntime.MatchDispatcher,
    tick: number,
    state: nkruntime.MatchState,
    presences: nkruntime.Presence[]
): { state: nkruntime.MatchState } | null {
    var s = state as TicTacToeState;

    for (var i = 0; i < presences.length; i++) {
        var userId = presences[i].userId;
        logger.info('Player %s left', userId);
        delete s.marks[userId];
        delete s.presences[userId];
    }

    // If game was already over, don't re-open the match
    if (!s.gameOver) {
        updateLabel(dispatcher, s);
    }

    return { state: s };
}

// ─── matchLoop ──────────────────────────────────────────────────────────────
// Called every tick. Process all incoming messages here.
function matchLoop(
    ctx: nkruntime.Context,
    logger: nkruntime.Logger,
    nk: nkruntime.Nakama,
    dispatcher: nkruntime.MatchDispatcher,
    tick: number,
    state: nkruntime.MatchState,
    messages: nkruntime.MatchMessage[]
): { state: nkruntime.MatchState } | null {
    var s = state as TicTacToeState;

    // Stop processing if game is already over
    if (s.gameOver) {
        return { state: s };
    }

    // Need 2 players to play
    if (Object.keys(s.presences).length < 2) {
        return { state: s };
    }

    for (var i = 0; i < messages.length; i++) {
        var msg = messages[i];

        if (msg.opCode !== OP_CODE_MOVE) {
            logger.warn('Unexpected opCode: %d', msg.opCode);
            continue;
        }

        var senderId = msg.sender.userId;
        var playerMark = s.marks[senderId];

        // Reject out-of-turn moves
        if (playerMark !== s.turn) {
            logger.warn('Player %s tried to move out of turn', senderId);
            continue;
        }

        // Parse the move payload
        var data: { position: number };
        try {
            data = JSON.parse(nk.binaryToString(msg.data));
        } catch (e) {
            logger.error('Failed to parse move: %s', e);
            continue;
        }

        var pos = data.position;

        // Validate position
        if (pos < 0 || pos > 8 || s.board[pos] !== 0) {
            logger.warn('Invalid position %d from player %s', pos, senderId);
            continue;
        }

        // Apply move
        s.board[pos] = playerMark;
        s.turn = playerMark === 1 ? 2 : 1;

        logger.info('Player %s placed mark %d at position %d', senderId, playerMark, pos);

        var result = checkWinner(s.board);

        if (result !== 0) {
            // Game over
            s.gameOver = true;
            s.winner = result;

            // Close the match from matchList immediately
            updateLabel(dispatcher, s);

            dispatcher.broadcastMessage(OP_CODE_END, JSON.stringify({
                board: s.board,
                winner: result,
                marks: s.marks,
            }));
            logger.info('Game over. Winner: %d', result);
        } else {
            // Broadcast updated board
            dispatcher.broadcastMessage(OP_CODE_UPDATE, JSON.stringify({
                board: s.board,
                turn: s.turn,
                marks: s.marks,
            }));
        }
    }

    return { state: s };
}

// ─── matchTerminate ─────────────────────────────────────────────────────────
function matchTerminate(
    ctx: nkruntime.Context,
    logger: nkruntime.Logger,
    nk: nkruntime.Nakama,
    dispatcher: nkruntime.MatchDispatcher,
    tick: number,
    state: nkruntime.MatchState,
    graceSeconds: number
): { state: nkruntime.MatchState } | null {
    logger.info('Match terminating, grace period: %d seconds', graceSeconds);
    return { state };
}

// ─── matchSignal ─────────────────────────────────────────────────────────────
function matchSignal(
    ctx: nkruntime.Context,
    logger: nkruntime.Logger,
    nk: nkruntime.Nakama,
    dispatcher: nkruntime.MatchDispatcher,
    tick: number,
    state: nkruntime.MatchState,
    data: string
): { state: nkruntime.MatchState, data?: string } | null {
    return { state };
}