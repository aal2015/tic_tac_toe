const moduleName = 'tic_tac_toe';

function rpcFindMatch(
    ctx: nkruntime.Context,
    logger: nkruntime.Logger,
    nk: nkruntime.Nakama,
    payload: string
): string {
    // Create a new authoritative match and return its ID to the client
    var matchId = nk.matchCreate(moduleName, {});
    logger.info('Match created with ID: %s', matchId);

    return JSON.stringify({ matchIds: [matchId] });
}