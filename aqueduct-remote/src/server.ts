import { Aqueduct } from 'aqueduct';
import * as bodyParser from 'body-parser';
import * as express from 'express';
import * as http from 'http';
import * as methodOverride from 'method-override';
import 'reflect-metadata';
// tslint:disable-next-line
const webSocket = require('html5-websocket');
import './controllers/trading-controller';
import './controllers/wallet-controller';
import { RegisterRoutes } from './routes';
import { waitForParity } from './wait-for-parity';

(global as any).WebSocket = webSocket;

Aqueduct.Initialize();

(async () => {
  await waitForParity();

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
    res.header('Access-Control-Allow-Headers', 'Origin, X-Requested-With, Content-Type, Accept');
    next();
  });

  RegisterRoutes(app);

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

  const port = 8700;
  server.listen(port, 'aqueduct-remote', (err: Error) => {
    if (err) {
      return console.log(err);
    }
    console.log(`Listening on aqueduct-remote:${port}`);
  });
})();
