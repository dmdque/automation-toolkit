/* tslint:disable */
import { Controller, ValidateParam, FieldErrors, ValidateError, TsoaRoute } from 'tsoa';
import { AccountsController } from './controllers/accounts-controller';
import { BandsController } from './controllers/bands-controller';
import { LogsController } from './controllers/logs-controller';
import { MarketsController } from './controllers/markets-controller';
import { TokenPairsController } from './controllers/token-pairs-controller';

const models: TsoaRoute.Models = {
    "IImportAccountRequest": {
        "properties": {
            "passphrase": { "dataType": "string", "required": true },
            "key": { "dataType": "string", "required": true },
        },
    },
    "IStoredBand": {
        "properties": {
            "marketId": { "dataType": "string", "required": true },
            "units": { "dataType": "double", "required": true },
            "minUnits": { "dataType": "double", "required": true },
            "spreadBps": { "dataType": "double", "required": true },
            "toleranceBps": { "dataType": "double", "required": true },
            "expirationSeconds": { "dataType": "double", "required": true },
            "side": { "dataType": "string", "required": true },
            "_id": { "dataType": "string", "required": true },
        },
    },
    "IBand": {
        "properties": {
            "marketId": { "dataType": "string", "required": true },
            "units": { "dataType": "double", "required": true },
            "minUnits": { "dataType": "double", "required": true },
            "spreadBps": { "dataType": "double", "required": true },
            "toleranceBps": { "dataType": "double", "required": true },
            "expirationSeconds": { "dataType": "double", "required": true },
            "side": { "dataType": "string", "required": true },
        },
    },
    "IValidateRemoveResult": {
        "properties": {
            "hasActiveOrders": { "dataType": "boolean", "required": true },
        },
    },
    "IRemoveBandRequest": {
        "properties": {
            "bandId": { "dataType": "string", "required": true },
            "hardCancelation": { "dataType": "boolean", "required": true },
        },
    },
    "IStoredLog": {
        "properties": {
            "dateCreated": { "dataType": "datetime", "required": true },
            "message": { "dataType": "string", "required": true },
            "type": { "dataType": "string", "required": true },
            "severity": { "dataType": "enum", "enums": ["critical", "error", "success", "info"], "required": true },
            "_id": { "dataType": "string", "required": true },
        },
    },
    "IStoredMarket": {
        "properties": {
            "label": { "dataType": "string", "required": true },
            "baseTokenSymbol": { "dataType": "string", "required": true },
            "maxBaseAmount": { "dataType": "string", "required": true },
            "minBaseAmount": { "dataType": "string", "required": true },
            "quoteTokenSymbol": { "dataType": "string", "required": true },
            "maxQuoteAmount": { "dataType": "string", "required": true },
            "minQuoteAmount": { "dataType": "string", "required": true },
            "minEthAmount": { "dataType": "string", "required": true },
            "cancellationMode": { "dataType": "enum", "enums": ["hard", "soft"], "required": true },
            "active": { "dataType": "boolean" },
            "_id": { "dataType": "string", "required": true },
        },
    },
    "ISetCancellationModeRequest": {
        "properties": {
            "marketId": { "dataType": "string", "required": true },
            "cancellationMode": { "dataType": "enum", "enums": ["hard", "soft"], "required": true },
        },
    },
    "IMarket": {
        "properties": {
            "label": { "dataType": "string", "required": true },
            "baseTokenSymbol": { "dataType": "string", "required": true },
            "maxBaseAmount": { "dataType": "string", "required": true },
            "minBaseAmount": { "dataType": "string", "required": true },
            "quoteTokenSymbol": { "dataType": "string", "required": true },
            "maxQuoteAmount": { "dataType": "string", "required": true },
            "minQuoteAmount": { "dataType": "string", "required": true },
            "minEthAmount": { "dataType": "string", "required": true },
            "cancellationMode": { "dataType": "enum", "enums": ["hard", "soft"], "required": true },
            "active": { "dataType": "boolean" },
        },
    },
    "IStartMarketRequest": {
        "properties": {
            "marketId": { "dataType": "string", "required": true },
            "passphrase": { "dataType": "string", "required": true },
        },
    },
    "IValidateStopResult": {
        "properties": {
            "hasActiveBands": { "dataType": "boolean", "required": true },
        },
    },
    "IStopMarketRequest": {
        "properties": {
            "marketId": { "dataType": "string", "required": true },
            "hardCancelation": { "dataType": "boolean", "required": true },
        },
    },
    "IMarketStats": {
        "properties": {
            "baseBalance": { "dataType": "string", "required": true },
            "baseUsdBalance": { "dataType": "string", "required": true },
            "quoteBalance": { "dataType": "string", "required": true },
            "quoteUsdBalance": { "dataType": "string", "required": true },
            "ethBalance": { "dataType": "string", "required": true },
            "ethUsdBalance": { "dataType": "string", "required": true },
            "openBaseAmount": { "dataType": "string", "required": true },
            "openQuoteAmount": { "dataType": "string", "required": true },
        },
    },
    "IMarketStatsHistory": {
        "properties": {
            "baseBalance": { "dataType": "string", "required": true },
            "baseUsdBalance": { "dataType": "string", "required": true },
            "quoteBalance": { "dataType": "string", "required": true },
            "quoteUsdBalance": { "dataType": "string", "required": true },
            "ethBalance": { "dataType": "string", "required": true },
            "ethUsdBalance": { "dataType": "string", "required": true },
            "openBaseAmount": { "dataType": "string", "required": true },
            "openQuoteAmount": { "dataType": "string", "required": true },
            "dateCreated": { "dataType": "datetime", "required": true },
            "marketId": { "dataType": "string", "required": true },
        },
    },
    "IToken": {
        "properties": {
            "name": { "dataType": "string", "required": true },
            "address": { "dataType": "string", "required": true },
            "symbol": { "dataType": "string", "required": true },
            "decimals": { "dataType": "double", "required": true },
        },
    },
    "ITokenPair": {
        "properties": {
            "tokenA": { "ref": "IToken", "required": true },
            "tokenB": { "ref": "IToken", "required": true },
            "minimumQuantity": { "dataType": "string", "required": true },
            "priceDecimals": { "dataType": "double", "required": true },
            "baseVolume": { "dataType": "string", "required": true },
            "quoteVolume": { "dataType": "string", "required": true },
        },
    },
    "ITokenTicker": {
        "properties": {
            "id": { "dataType": "string", "required": true },
            "name": { "dataType": "string", "required": true },
            "symbol": { "dataType": "string", "required": true },
            "usdPrice": { "dataType": "string", "required": true },
            "btcPrice": { "dataType": "string", "required": true },
            "hourlyPercentageChange": { "dataType": "string", "required": true },
            "dailyPercentageChange": { "dataType": "string", "required": true },
            "weeklyPercentageChange": { "dataType": "string", "required": true },
            "dailyVolume": { "dataType": "string", "required": true },
            "priceEth": { "dataType": "string", "required": true },
        },
    },
};

export function RegisterRoutes(app: any) {
    app.get('/api/accounts',
        function(request: any, response: any, next: any) {
            const args = {
            };

            let validatedArgs: any[] = [];
            try {
                validatedArgs = getValidatedArgs(args, request);
            } catch (err) {
                return next(err);
            }

            const controller = new AccountsController();


            const promise = controller.getAccount.apply(controller, validatedArgs);
            promiseHandler(controller, promise, response, next);
        });
    app.post('/api/accounts/import',
        function(request: any, response: any, next: any) {
            const args = {
                request: { "in": "body", "name": "request", "required": true, "ref": "IImportAccountRequest" },
            };

            let validatedArgs: any[] = [];
            try {
                validatedArgs = getValidatedArgs(args, request);
            } catch (err) {
                return next(err);
            }

            const controller = new AccountsController();


            const promise = controller.importAccount.apply(controller, validatedArgs);
            promiseHandler(controller, promise, response, next);
        });
    app.get('/api/accounts/get_token_balance',
        function(request: any, response: any, next: any) {
            const args = {
                tokenAddress: { "in": "query", "name": "tokenAddress", "required": true, "dataType": "string" },
            };

            let validatedArgs: any[] = [];
            try {
                validatedArgs = getValidatedArgs(args, request);
            } catch (err) {
                return next(err);
            }

            const controller = new AccountsController();


            const promise = controller.getTokenBalance.apply(controller, validatedArgs);
            promiseHandler(controller, promise, response, next);
        });
    app.get('/api/accounts/get_eth_balance',
        function(request: any, response: any, next: any) {
            const args = {
            };

            let validatedArgs: any[] = [];
            try {
                validatedArgs = getValidatedArgs(args, request);
            } catch (err) {
                return next(err);
            }

            const controller = new AccountsController();


            const promise = controller.getEthBalance.apply(controller, validatedArgs);
            promiseHandler(controller, promise, response, next);
        });
    app.get('/api/bands',
        function(request: any, response: any, next: any) {
            const args = {
                marketId: { "in": "query", "name": "marketId", "required": true, "dataType": "string" },
            };

            let validatedArgs: any[] = [];
            try {
                validatedArgs = getValidatedArgs(args, request);
            } catch (err) {
                return next(err);
            }

            const controller = new BandsController();


            const promise = controller.getBands.apply(controller, validatedArgs);
            promiseHandler(controller, promise, response, next);
        });
    app.post('/api/bands',
        function(request: any, response: any, next: any) {
            const args = {
                request: { "in": "body", "name": "request", "required": true, "ref": "IBand" },
            };

            let validatedArgs: any[] = [];
            try {
                validatedArgs = getValidatedArgs(args, request);
            } catch (err) {
                return next(err);
            }

            const controller = new BandsController();


            const promise = controller.createBand.apply(controller, validatedArgs);
            promiseHandler(controller, promise, response, next);
        });
    app.post('/api/bands/validate-remove/:bandId',
        function(request: any, response: any, next: any) {
            const args = {
                bandId: { "in": "path", "name": "bandId", "required": true, "dataType": "string" },
            };

            let validatedArgs: any[] = [];
            try {
                validatedArgs = getValidatedArgs(args, request);
            } catch (err) {
                return next(err);
            }

            const controller = new BandsController();


            const promise = controller.validateRemoveBand.apply(controller, validatedArgs);
            promiseHandler(controller, promise, response, next);
        });
    app.post('/api/bands/remove',
        function(request: any, response: any, next: any) {
            const args = {
                request: { "in": "body", "name": "request", "required": true, "ref": "IRemoveBandRequest" },
            };

            let validatedArgs: any[] = [];
            try {
                validatedArgs = getValidatedArgs(args, request);
            } catch (err) {
                return next(err);
            }

            const controller = new BandsController();


            const promise = controller.removeBand.apply(controller, validatedArgs);
            promiseHandler(controller, promise, response, next);
        });
    app.get('/api/logs/market/:marketId',
        function(request: any, response: any, next: any) {
            const args = {
                marketId: { "in": "path", "name": "marketId", "required": true, "dataType": "string" },
            };

            let validatedArgs: any[] = [];
            try {
                validatedArgs = getValidatedArgs(args, request);
            } catch (err) {
                return next(err);
            }

            const controller = new LogsController();


            const promise = controller.getMarketLogs.apply(controller, validatedArgs);
            promiseHandler(controller, promise, response, next);
        });
    app.get('/api/logs/band/:bandId',
        function(request: any, response: any, next: any) {
            const args = {
                bandId: { "in": "path", "name": "bandId", "required": true, "dataType": "string" },
            };

            let validatedArgs: any[] = [];
            try {
                validatedArgs = getValidatedArgs(args, request);
            } catch (err) {
                return next(err);
            }

            const controller = new LogsController();


            const promise = controller.getBandLogs.apply(controller, validatedArgs);
            promiseHandler(controller, promise, response, next);
        });
    app.get('/api/markets',
        function(request: any, response: any, next: any) {
            const args = {
            };

            let validatedArgs: any[] = [];
            try {
                validatedArgs = getValidatedArgs(args, request);
            } catch (err) {
                return next(err);
            }

            const controller = new MarketsController();


            const promise = controller.get.apply(controller, validatedArgs);
            promiseHandler(controller, promise, response, next);
        });
    app.delete('/api/markets/:marketId',
        function(request: any, response: any, next: any) {
            const args = {
                marketId: { "in": "path", "name": "marketId", "required": true, "dataType": "string" },
            };

            let validatedArgs: any[] = [];
            try {
                validatedArgs = getValidatedArgs(args, request);
            } catch (err) {
                return next(err);
            }

            const controller = new MarketsController();


            const promise = controller.deleteMarket.apply(controller, validatedArgs);
            promiseHandler(controller, promise, response, next);
        });
    app.patch('/api/markets/set-cancellation-mode',
        function(request: any, response: any, next: any) {
            const args = {
                request: { "in": "body", "name": "request", "required": true, "ref": "ISetCancellationModeRequest" },
            };

            let validatedArgs: any[] = [];
            try {
                validatedArgs = getValidatedArgs(args, request);
            } catch (err) {
                return next(err);
            }

            const controller = new MarketsController();


            const promise = controller.setCancellationMode.apply(controller, validatedArgs);
            promiseHandler(controller, promise, response, next);
        });
    app.post('/api/markets',
        function(request: any, response: any, next: any) {
            const args = {
                request: { "in": "body", "name": "request", "required": true, "ref": "IMarket" },
            };

            let validatedArgs: any[] = [];
            try {
                validatedArgs = getValidatedArgs(args, request);
            } catch (err) {
                return next(err);
            }

            const controller = new MarketsController();


            const promise = controller.create.apply(controller, validatedArgs);
            promiseHandler(controller, promise, response, next);
        });
    app.post('/api/markets/start',
        function(request: any, response: any, next: any) {
            const args = {
                request: { "in": "body", "name": "request", "required": true, "ref": "IStartMarketRequest" },
            };

            let validatedArgs: any[] = [];
            try {
                validatedArgs = getValidatedArgs(args, request);
            } catch (err) {
                return next(err);
            }

            const controller = new MarketsController();


            const promise = controller.startMarket.apply(controller, validatedArgs);
            promiseHandler(controller, promise, response, next);
        });
    app.post('/api/markets/attempt_stop/:id',
        function(request: any, response: any, next: any) {
            const args = {
                id: { "in": "path", "name": "id", "required": true, "dataType": "string" },
            };

            let validatedArgs: any[] = [];
            try {
                validatedArgs = getValidatedArgs(args, request);
            } catch (err) {
                return next(err);
            }

            const controller = new MarketsController();


            const promise = controller.validateStop.apply(controller, validatedArgs);
            promiseHandler(controller, promise, response, next);
        });
    app.post('/api/markets/stop',
        function(request: any, response: any, next: any) {
            const args = {
                request: { "in": "body", "name": "request", "required": true, "ref": "IStopMarketRequest" },
            };

            let validatedArgs: any[] = [];
            try {
                validatedArgs = getValidatedArgs(args, request);
            } catch (err) {
                return next(err);
            }

            const controller = new MarketsController();


            const promise = controller.stopMarket.apply(controller, validatedArgs);
            promiseHandler(controller, promise, response, next);
        });
    app.get('/api/markets/network_id',
        function(request: any, response: any, next: any) {
            const args = {
            };

            let validatedArgs: any[] = [];
            try {
                validatedArgs = getValidatedArgs(args, request);
            } catch (err) {
                return next(err);
            }

            const controller = new MarketsController();


            const promise = controller.getNetworkId.apply(controller, validatedArgs);
            promiseHandler(controller, promise, response, next);
        });
    app.get('/api/markets/latest_stats/:marketId',
        function(request: any, response: any, next: any) {
            const args = {
                marketId: { "in": "path", "name": "marketId", "required": true, "dataType": "string" },
            };

            let validatedArgs: any[] = [];
            try {
                validatedArgs = getValidatedArgs(args, request);
            } catch (err) {
                return next(err);
            }

            const controller = new MarketsController();


            const promise = controller.getLatestStats.apply(controller, validatedArgs);
            promiseHandler(controller, promise, response, next);
        });
    app.get('/api/markets/stats/:marketId',
        function(request: any, response: any, next: any) {
            const args = {
                marketId: { "in": "path", "name": "marketId", "required": true, "dataType": "string" },
            };

            let validatedArgs: any[] = [];
            try {
                validatedArgs = getValidatedArgs(args, request);
            } catch (err) {
                return next(err);
            }

            const controller = new MarketsController();


            const promise = controller.getStats.apply(controller, validatedArgs);
            promiseHandler(controller, promise, response, next);
        });
    app.get('/api/token-pairs',
        function(request: any, response: any, next: any) {
            const args = {
            };

            let validatedArgs: any[] = [];
            try {
                validatedArgs = getValidatedArgs(args, request);
            } catch (err) {
                return next(err);
            }

            const controller = new TokenPairsController();


            const promise = controller.get.apply(controller, validatedArgs);
            promiseHandler(controller, promise, response, next);
        });
    app.get('/api/token-pairs/tickers',
        function(request: any, response: any, next: any) {
            const args = {
            };

            let validatedArgs: any[] = [];
            try {
                validatedArgs = getValidatedArgs(args, request);
            } catch (err) {
                return next(err);
            }

            const controller = new TokenPairsController();


            const promise = controller.getTickers.apply(controller, validatedArgs);
            promiseHandler(controller, promise, response, next);
        });


    function promiseHandler(controllerObj: any, promise: any, response: any, next: any) {
        return Promise.resolve(promise)
            .then((data: any) => {
                let statusCode;
                if (controllerObj instanceof Controller) {
                    const controller = controllerObj as Controller
                    const headers = controller.getHeaders();
                    Object.keys(headers).forEach((name: string) => {
                        response.set(name, headers[name]);
                    });

                    statusCode = controller.getStatus();
                }

                if (data) {
                    response.status(statusCode || 200).json(data);
                } else {
                    response.status(statusCode || 204).end();
                }
            })
            .catch((error: any) => next(error));
    }

    function getValidatedArgs(args: any, request: any): any[] {
        const fieldErrors: FieldErrors = {};
        const values = Object.keys(args).map((key) => {
            const name = args[key].name;
            switch (args[key].in) {
                case 'request':
                    return request;
                case 'query':
                    return ValidateParam(args[key], request.query[name], models, name, fieldErrors);
                case 'path':
                    return ValidateParam(args[key], request.params[name], models, name, fieldErrors);
                case 'header':
                    return ValidateParam(args[key], request.header(name), models, name, fieldErrors);
                case 'body':
                    return ValidateParam(args[key], request.body, models, name, fieldErrors, name + '.');
                case 'body-prop':
                    return ValidateParam(args[key], request.body[name], models, name, fieldErrors, 'body.');
            }
        });
        if (Object.keys(fieldErrors).length > 0) {
            throw new ValidateError(fieldErrors, '');
        }
        return values;
    }
}
