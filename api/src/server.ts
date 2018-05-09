import { Aqueduct } from 'aqueduct';
import * as bodyParser from 'body-parser';
import * as express from 'express';
// tslint:disable-next-line
const webSocket = require('html5-websocket');
import * as http from 'http';
import * as methodOverride from 'method-override';
import 'reflect-metadata';
import { tickerDataCache } from './cache/ticker-data-cache';
import { tokenPairCache } from './cache/token-pair-cache';
import { config } from './config';
import './controllers/accounts-controller';
import './controllers/bands-controller';
import './controllers/logs-controller';
import './controllers/markets-controller';
import './controllers/token-pairs-controller';
import { reportRoutes } from './report-routes';
import { RegisterRoutes } from './routes';
import { PendingAqueductService } from './services/pending-aqueduct-service';
import { AqueductRemote } from './swagger/aqueduct-remote';
import { Worker } from './worker/worker';

(global as any).WebSocket = webSocket;

AqueductRemote.Initialize({ host: 'aqueduct-remote:8700' });
Aqueduct.Initialize();

(async () => {
  await new PendingAqueductService().waitForAqueductRemote();
  const network = await new AqueductRemote.Api.WalletService().getNetwork();
  config.networkId = network.id;
  config.chain = network.chain as 'kovan' | 'foundation';
  new Worker().start();

  await tokenPairCache.getTokenPairs(config.networkId);
  await tickerDataCache.initialize();

  const app = express();
  const server = http.createServer(app);
  app.use(bodyParser.urlencoded({ extended: true }));
  app.use(bodyParser.json());
  app.use(methodOverride());

  app.use('/swagger.json', (_req, res) => {
    res.sendFile(__dirname + '/swagger.json');
  });

  app.use((_req, res, next) => {
    res.header('Access-Control-Allow-Origin', '*');
    res.header('Access-Control-Allow-Methods', 'GET,POST,PATCH,PUT,DELETE,OPTIONS');
    res.header('Access-Control-Allow-Headers', 'Origin, X-Requested-With, Content-Type, Accept');
    next();
  });

  RegisterRoutes(app);
  reportRoutes(app);

  // It's important that this come after the main routes are registered
  app.use((err: any, _req: express.Request, res: express.Response, next: express.NextFunction) => {
    const status = err.status || 500;
    const body: any = {
      fields: err.fields || undefined,
      message: err.message || 'An error occurred during the request.',
      name: err.name,
      status
    };
    res.status(status).json(body);
    next();
  });

  app.get('/', (_req, res) => {
    res.sendStatus(200);
  });

  const port = 8662;
  server.listen(port, '0.0.0.0', (err: Error) => {
    if (err) {
      return console.log(err);
    }
    console.log(`Listening on port ${port}.`);
  });

  const onError = (err: Error) => {
    console.error('uncaughtException...');
    console.error(err);
  };

  process.on('uncaughtException', onError);
  process.on('unhandledRejection', err => {
    console.log(err);
  });
})();
