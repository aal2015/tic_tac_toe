const moduleName = 'tic_tac_toe';

function rpcFindMatch(
    ctx: nkruntime.Context,
    logger: nkruntime.Logger,
    nk: nkruntime.Nakama,
    payload: string
): string {

    // Only find matches that have label open:1
    // This excludes full matches and finished games
    var matches = nk.matchList(
        10,
        true,           // authoritative
        null,           // label: null — we use query instead
        0,              // minSize
        1,              // maxSize: not full
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