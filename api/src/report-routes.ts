import * as express from 'express';
import * as moment from 'moment';
import { CancelationReport } from './reports/cx-report';

export const reportRoutes = (app: express.Express) => {
  app.get('/api/reports/cancelations/:marketId', async (req, res, next) => {
    const marketId = req.params.marketId;

    const report = new CancelationReport(marketId);
    const content = await report.generate();

    const fileName = `cx-report-${moment().format('MM-DD-YY')}.csv`;

    res.setHeader('Content-disposition', `attachment; filename=${fileName}`);
    res.set('Content-Type', 'text/csv');
    res.status(200).send(content);

    next();
  });
};
