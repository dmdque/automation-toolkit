import { Body, Get, Post, Query, Route, Tags } from 'tsoa';
import { BandRepository, IBand, IStoredBand } from '../db/band-repository';
import { ServerError } from '../errors/server-error';

@Route('bands')
export class BandsController {
  private readonly bandsRepository = new BandRepository();

  @Get()
  @Tags('Bands')
  public async getBands(@Query() marketId: string): Promise<IStoredBand[]> {
    return await this.bandsRepository.find({ marketId });
  }

  @Post()
  @Tags('Bands')
  public async createBand(@Body() request: IBand): Promise<IStoredBand> {
    if (request.spread <= 0 || request.spread > 1) {
      throw new ServerError('spread should be > 0 and <= 1 (decimals)', 400);
    }

    if (request.ratio < .01 || request.ratio > 1) {
      throw new ServerError('ratio should be > .01 and < 1', 400);
    }

    if (request.expirationSeconds < 600) {
      throw new ServerError('expirationSeconds should be >= 600 (10 minutes)');
    }

    return await this.bandsRepository.create(request);
  }
}
