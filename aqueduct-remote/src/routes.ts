/* tslint:disable */
import { Controller, ValidateParam, FieldErrors, ValidateError, TsoaRoute } from 'tsoa';
import { TradingController } from './controllers/trading-controller';
import { WalletController } from './controllers/wallet-controller';

const models: TsoaRoute.Models = {
    "IOrder": {
        "properties": {
            "id": { "dataType": "double", "required": true },
            "dateCreated": { "dataType": "datetime", "required": true },
            "dateUpdated": { "dataType": "datetime", "required": true },
            "dateClosed": { "dataType": "datetime", "required": true },
            "networkId": { "dataType": "double", "required": true },
            "exchangeContractAddress": { "dataType": "string", "required": true },
            "expirationUnixTimestampSec": { "dataType": "double", "required": true },
            "feeRecipient": { "dataType": "string", "required": true },
            "maker": { "dataType": "string", "required": true },
            "makerFee": { "dataType": "string", "required": true },
            "makerTokenAddress": { "dataType": "string", "required": true },
            "makerTokenAmount": { "dataType": "string", "required": true },
            "salt": { "dataType": "string", "required": true },
            "serializedEcSignature": { "dataType": "string", "required": true },
            "taker": { "dataType": "string", "required": true },
            "takerFee": { "dataType": "string", "required": true },
            "takerTokenAddress": { "dataType": "string", "required": true },
            "takerTokenAmount": { "dataType": "string", "required": true },
            "remainingTakerTokenAmount": { "dataType": "string", "required": true },
            "orderHash": { "dataType": "string", "required": true },
            "accountId": { "dataType": "double" },
            "state": { "dataType": "double", "required": true },
            "source": { "dataType": "string", "required": true },
        },
    },
    "ILimitOrderRequest": {
        "properties": {
            "baseTokenSymbol": { "dataType": "string", "required": true },
            "quoteTokenSymbol": { "dataType": "string", "required": true },
            "expirationDate": { "dataType": "datetime", "required": true },
            "price": { "dataType": "string", "required": true },
            "quantityInWei": { "dataType": "string", "required": true },
            "side": { "dataType": "string", "required": true },
        },
    },
    "ICancelOrderRequest": {
        "properties": {
            "orderHash": { "dataType": "string", "required": true },
            "gasPrice": { "dataType": "string" },
        },
    },
    "ICancelReceipt": {
        "properties": {
            "gasCost": { "dataType": "string", "required": true },
            "status": { "dataType": "double", "required": true },
        },
    },
    "IImportAccountRequest": {
        "properties": {
            "key": { "dataType": "string", "required": true },
            "passphrase": { "dataType": "string", "required": true },
        },
    },
    "IUnlockAccountParams": {
        "properties": {
            "passphrase": { "dataType": "string", "required": true },
        },
    },
    "INodeHealth": {
        "properties": {
            "success": { "dataType": "boolean" },
            "error": { "dataType": "string" },
        },
    },
};

export function RegisterRoutes(app: any) {
    app.post('/api/trading/limit_order',
        function(request: any, response: any, next: any) {
            const args = {
                request: { "in": "body", "name": "request", "required": true, "ref": "ILimitOrderRequest" },
            };

            let validatedArgs: any[] = [];
            try {
                validatedArgs = getValidatedArgs(args, request);
            } catch (err) {
                return next(err);
            }

            const controller = new TradingController();


            const promise = controller.createLimitOrder.apply(controller, validatedArgs);
            promiseHandler(controller, promise, response, next);
        });
    app.post('/api/trading/cancel_order',
        function(request: any, response: any, next: any) {
            const args = {
                request: { "in": "body", "name": "request", "required": true, "ref": "ICancelOrderRequest" },
            };

            let validatedArgs: any[] = [];
            try {
                validatedArgs = getValidatedArgs(args, request);
            } catch (err) {
                return next(err);
            }

            const controller = new TradingController();


            const promise = controller.cancelOrder.apply(controller, validatedArgs);
            promiseHandler(controller, promise, response, next);
        });
    app.post('/api/trading/soft_cancel_order/:orderHash',
        function(request: any, response: any, next: any) {
            const args = {
                orderHash: { "in": "path", "name": "orderHash", "required": true, "dataType": "string" },
            };

            let validatedArgs: any[] = [];
            try {
                validatedArgs = getValidatedArgs(args, request);
            } catch (err) {
                return next(err);
            }

            const controller = new TradingController();


            const promise = controller.softCancelOrder.apply(controller, validatedArgs);
            promiseHandler(controller, promise, response, next);
        });
    app.post('/api/trading/cancel_receipt/:txHash',
        function(request: any, response: any, next: any) {
            const args = {
                txHash: { "in": "path", "name": "txHash", "required": true, "dataType": "string" },
            };

            let validatedArgs: any[] = [];
            try {
                validatedArgs = getValidatedArgs(args, request);
            } catch (err) {
                return next(err);
            }

            const controller = new TradingController();


            const promise = controller.getCancelReceipt.apply(controller, validatedArgs);
            promiseHandler(controller, promise, response, next);
        });
    app.get('/api/wallet/account',
        function(request: any, response: any, next: any) {
            const args = {
            };

            let validatedArgs: any[] = [];
            try {
                validatedArgs = getValidatedArgs(args, request);
            } catch (err) {
                return next(err);
            }

            const controller = new WalletController();


            const promise = controller.getAccount.apply(controller, validatedArgs);
            promiseHandler(controller, promise, response, next);
        });
    app.post('/api/wallet/import',
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

            const controller = new WalletController();


            const promise = controller.importAccount.apply(controller, validatedArgs);
            promiseHandler(controller, promise, response, next);
        });
    app.post('/api/wallet/unlock',
        function(request: any, response: any, next: any) {
            const args = {
                request: { "in": "body", "name": "request", "required": true, "ref": "IUnlockAccountParams" },
            };

            let validatedArgs: any[] = [];
            try {
                validatedArgs = getValidatedArgs(args, request);
            } catch (err) {
                return next(err);
            }

            const controller = new WalletController();


            const promise = controller.unlockAccount.apply(controller, validatedArgs);
            promiseHandler(controller, promise, response, next);
        });
    app.get('/api/wallet/balance',
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

            const controller = new WalletController();


            const promise = controller.getBalance.apply(controller, validatedArgs);
            promiseHandler(controller, promise, response, next);
        });
    app.get('/api/wallet/eth_balance',
        function(request: any, response: any, next: any) {
            const args = {
            };

            let validatedArgs: any[] = [];
            try {
                validatedArgs = getValidatedArgs(args, request);
            } catch (err) {
                return next(err);
            }

            const controller = new WalletController();


            const promise = controller.getEthBalance.apply(controller, validatedArgs);
            promiseHandler(controller, promise, response, next);
        });
    app.get('/api/wallet/node_health',
        function(request: any, response: any, next: any) {
            const args = {
            };

            let validatedArgs: any[] = [];
            try {
                validatedArgs = getValidatedArgs(args, request);
            } catch (err) {
                return next(err);
            }

            const controller = new WalletController();


            const promise = controller.getNodeHealth.apply(controller, validatedArgs);
            promiseHandler(controller, promise, response, next);
        });
    app.get('/api/wallet/network_id',
        function(request: any, response: any, next: any) {
            const args = {
            };

            let validatedArgs: any[] = [];
            try {
                validatedArgs = getValidatedArgs(args, request);
            } catch (err) {
                return next(err);
            }

            const controller = new WalletController();


            const promise = controller.getNetworkId.apply(controller, validatedArgs);
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
