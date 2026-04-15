function rpcHealthCheck(ctx: nkruntime.Context, logger: nkruntime.Logger, nk: nkruntime.Nakama, payload: string): string {
    logger.info('healtcheck rpc called');
    return JSON.stringify({ success: true });   
}