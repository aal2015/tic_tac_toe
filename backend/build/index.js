"use strict";
function InitModule(ctx, logger, nk, initializer) {
    initializer.registerRpc('healthcheck', rpcHealthCheck);
    logger.info('JavaScript logic loaded.');
}
function rpcHealthCheck(ctx, logger, nk, payload) {
    logger.info('healtcheck rpc called');
    return JSON.stringify({ success: true });
}
