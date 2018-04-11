/* tslint:disable */
import { Controller, ValidateParam, FieldErrors, ValidateError, TsoaRoute } from 'tsoa';
import { MarketsController } from './controllers/markets-controller';
import { TokenPairsController } from './controllers/token-pairs-controller';

const models: TsoaRoute.Models = {
  "IStoredMarket": {
    "properties": {
      "label": { "dataType": "string", "required": true },
      "baseTokenSymbol": { "dataType": "string", "required": true },
      "quoteTokenSymbol": { "dataType": "string", "required": true },
      "_id": { "dataType": "string", "required": true },
    },
  },
  "IMarket": {
    "properties": {
      "label": { "dataType": "string", "required": true },
      "baseTokenSymbol": { "dataType": "string", "required": true },
      "quoteTokenSymbol": { "dataType": "string", "required": true },
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
};

export function RegisterRoutes(app: any) {
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
