function rpcFindMatch(
    ctx: nkruntime.Context,
    logger: nkruntime.Logger,
    nk: nkruntime.Nakama,
    payload: string
): string {

    // Create the authoritative match using your registered handler
    const matchId = nk.matchCreate("tic_tac_toe", {});

    logger.info("Match created: %s", matchId);

    return JSON.stringify({
        matchId: matchId
    });
}