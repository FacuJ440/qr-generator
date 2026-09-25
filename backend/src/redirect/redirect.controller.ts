import { Controller, Get, Param, Res, Req, Logger } from '@nestjs/common';
import { ApiTags, ApiOperation } from '@nestjs/swagger';
import { Request, Response } from 'express';
import { RedirectService } from './redirect.service';
import { Throttle } from '@nestjs/throttler';
import { Public } from '../common/decorators/public.decorator';

@ApiTags('Redirect')
@Controller('r')
@Public()
export class RedirectController {
  private readonly logger = new Logger(RedirectController.name);

  constructor(private readonly redirectService: RedirectService) {}

  @Get(':shortCode')
  @Throttle({ short: { ttl: 1000, limit: 20 } })
  @ApiOperation({ summary: 'Redirect to target URL and track scan' })
  async redirect(
    @Param('shortCode') shortCode: string,
    @Req() req: Request,
    @Res() res: Response,
  ): Promise<void> {
    const ip = (req.headers['x-forwarded-for'] as string)?.split(',')[0]?.trim() || req.ip || null;
    const userAgent = req.headers['user-agent'] || null;
    const referrer = req.headers['referer'] || null;

    try {
      const result = await this.redirectService.resolveAndTrack(shortCode, {
        ip,
        userAgent,
        referrer,
      });

      if (result.shouldRedirect && result.targetUrl) {
        res.redirect(302, result.targetUrl);
      } else {
        // QR inactive or expired — show notice page
        res.status(302).redirect(`/expired?code=${shortCode}`);
      }
    } catch (err) {
      this.logger.warn(`Redirect failed for ${shortCode}: ${(err as Error).message}`);
      res.status(404).redirect('/not-found');
    }
  }
}
