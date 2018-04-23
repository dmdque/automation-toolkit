import * as express from 'express';

const app = express();

app.use(express.static('dist'));

const port = 8663;
app.listen(port, '0.0.0.0', (err: Error) => {
  if (err) { return console.error(err); }
  // tslint:disable-next-line:no-console
  console.log(`Listening on port ${port}.`);
});
