import { Module } from '@nestjs/common';
import { BotService } from './bot.service';
import { BotController } from './bot.controller';
import { SequelizeModule } from '@nestjs/sequelize';
import { ToBot } from './models/bot.model';

@Module({
  imports: [SequelizeModule.forFeature([ToBot])],
  controllers: [BotController],
  providers: [BotService],
})
export class BotModule {}
