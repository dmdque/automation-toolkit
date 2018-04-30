import { Body, Get, Post, Query, Route, Tags } from 'tsoa';
import { bandRepository, IBand, IStoredBand } from '../db/band-repository';
import { ServerError } from '../errors/server-error';
import { BandService, IRemoveBandRequest, IValidateRemoveResult } from '../services/band-service';

@Route('bands')
export class BandsController {
  @Get()
  @Tags('Bands')
  public async getBands(@Query() marketId: string): Promise<IStoredBand[]> {
    return await bandRepository.find({ marketId });
  }

  @Post()
  @Tags('Bands')
  public async createBand(@Body() request: IBand): Promise<IStoredBand> {
    if (request.spreadBps <= 0 || request.spreadBps > 10000) {
      throw new ServerError('spread should be > 0 and <= 10000 (bps)', 400);
    }

    if (request.expirationSeconds < 300 || request.expirationSeconds > 1200) {
      throw new ServerError('expirationSeconds should be >= 300 (5 minutes) and <= 1200 (20 minutes)');
    }

    return await bandRepository.create(request);
  }

  @Post('validate-remove/{bandId}')
  @Tags('Bands')
  public async validateRemoveBand(bandId: string): Promise<IValidateRemoveResult> {
    return await new BandService().validateRemove(bandId);
  }

  @Post('remove')
  @Tags('Bands')
  public async removeBand(@Body() request: IRemoveBandRequest) {
    await new BandService().remove(request);
  }
}
