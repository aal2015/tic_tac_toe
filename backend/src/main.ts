function InitModule(
    ctx: nkruntime.Context,
    logger: nkruntime.Logger,
    nk: nkruntime.Nakama,
    initializer: nkruntime.Initializer
) {
    // Register the healthcheck RPC
    initializer.registerRpc('healthcheck', rpcHealthCheck);

    // Register the find_match RPC
    initializer.registerRpc('find_match', rpcFindMatch);

    // Register the match handler — name must match moduleName in rpc.ts
    initializer.registerMatch('tic_tac_toe', {
        matchInit,
        matchJoinAttempt,
        matchJoin,
        matchLeave,
        matchLoop,
        matchTerminate,
        matchSignal,
    });

    logger.info('Tic-tac-toe module loaded.');
}