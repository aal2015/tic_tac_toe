"use strict";
function rpcHealthCheck(ctx, logger, nk, payload) {
    logger.info('health check rpc called!');
    return JSON.stringify({ success: true });
}
// ─── Opcodes ────────────────────────────────────────────────────────────────
// These numbers must match what your React client uses
var OP_CODE_START = 1; // server → client: game started, marks assigned
var OP_CODE_UPDATE = 2; // server → client: board state after a move
var OP_CODE_END = 3; // server → client: game over with result
var OP_CODE_MOVE = 4; // client → server: player submits a move
// ─── Helper: check for a winner ─────────────────────────────────────────────
function checkWinner(board) {
    var lines = [
        [0, 1, 2], [3, 4, 5], [6, 7, 8], // rows
        [0, 3, 6], [1, 4, 7], [2, 5, 8], // cols
        [0, 4, 8], [2, 4, 6], // diagonals
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
        if (board[j] === 0) {
            filled = false;
            break;
        }
    }
    return filled ? 3 : 0;
}
// Call this whenever state changes to keep matchList accurate
function updateLabel(dispatcher, s) {
    var label = JSON.stringify({
        open: !s.gameOver && Object.keys(s.presences).length < 2 ? 1 : 0,
    });
    dispatcher.matchLabelUpdate(label);
}
// ─── matchInit ──────────────────────────────────────────────────────────────
// Called once when the match is created via nk.matchCreate()
function matchInit(ctx, logger, nk, params) {
    var state = {
        board: [0, 0, 0, 0, 0, 0, 0, 0, 0],
        marks: {},
        presences: {},
        turn: 1,
        winner: 0,
        gameOver: false,
    };
    logger.info('Match created');
    return {
        state: state,
        tickRate: 1, // 1 tick per second is enough for turn-based
        label: JSON.stringify({ open: 1 }),
    };
}
// ─── matchJoinAttempt ───────────────────────────────────────────────────────
// Called when a player tries to join. Return accept: false to reject them.
function matchJoinAttempt(ctx, logger, nk, dispatcher, tick, state, presence, metadata) {
    var s = state;
    var playerCount = Object.keys(s.marks).length;
    if (playerCount >= 2) {
        return { state: s, accept: false, rejectMessage: 'Match is full' };
    }
    return { state: s, accept: true };
}
// ─── matchJoin ──────────────────────────────────────────────────────────────
// Called after a player is accepted. Assign their mark and start if 2 players.
function matchJoin(ctx, logger, nk, dispatcher, tick, state, presences) {
    var s = state;
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
function matchLeave(ctx, logger, nk, dispatcher, tick, state, presences) {
    var s = state;
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
function matchLoop(ctx, logger, nk, dispatcher, tick, state, messages) {
    var s = state;
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
        var data;
        try {
            data = JSON.parse(nk.binaryToString(msg.data));
        }
        catch (e) {
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
        }
        else {
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
function matchTerminate(ctx, logger, nk, dispatcher, tick, state, graceSeconds) {
    logger.info('Match terminating, grace period: %d seconds', graceSeconds);
    return { state: state };
}
// ─── matchSignal ─────────────────────────────────────────────────────────────
function matchSignal(ctx, logger, nk, dispatcher, tick, state, data) {
    return { state: state };
}
var moduleName = 'tic_tac_toe';
function rpcFindMatch(ctx, logger, nk, payload) {
    // Only find matches that have label open:1
    // This excludes full matches and finished games
    var matches = nk.matchList(10, true, // authoritative
    null, // label: null — we use query instead
    0, // minSize
    1, // maxSize: not full
    '+label.open:1' // query: only open matches
    );
    if (matches.length > 0) {
        var matchId = matches[0].matchId;
        logger.info('Found open match: %s', matchId);
        return JSON.stringify({
            matchIds: [matchId],
            status: 'matched',
        });
    }
    // No open match — create one
    var newMatchId = nk.matchCreate(moduleName, {});
    logger.info('Created new match: %s', newMatchId);
    return JSON.stringify({
        matchIds: [newMatchId],
        status: 'waiting',
    });
}
function InitModule(ctx, logger, nk, initializer) {
    // Register the healthcheck RPC
    initializer.registerRpc('healthcheck', rpcHealthCheck);
    // // Register the find_match RPC
    initializer.registerRpc('find_match', rpcFindMatch);
    // Register the match handler — name must match moduleName in rpc.ts
    initializer.registerMatch('tic_tac_toe', {
        matchInit: matchInit,
        matchJoinAttempt: matchJoinAttempt,
        matchJoin: matchJoin,
        matchLeave: matchLeave,
        matchLoop: matchLoop,
        matchTerminate: matchTerminate,
        matchSignal: matchSignal,
    });
    logger.info('Tic-tac-toe module loaded.');
}
