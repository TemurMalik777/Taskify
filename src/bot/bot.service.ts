import { Injectable, OnModuleInit } from '@nestjs/common';
import { Bot, InlineKeyboard, session } from 'grammy';
import {
  Conversation,
  conversations,
  createConversation,
} from '@grammyjs/conversations';
import { InjectModel } from '@nestjs/sequelize';
import { ToBot } from './models/bot.model';
import { ConfigService } from '@nestjs/config';
import { MyContext } from './types/my-context';
import { TaskValidator } from './validators/bot.validator';

@Injectable()
export class BotService implements OnModuleInit {
  private bot: Bot<MyContext>;

  constructor(
    @InjectModel(ToBot)
    private readonly taskModel: typeof ToBot,
    private readonly configService: ConfigService,
  ) {}

  async onModuleInit() {
    const token = this.configService.get<string>('TELEGRAM_BOT_TOKEN');
    if (!token) throw new Error('TELEGRAM_BOT_TOKEN is missing in .env');

    this.bot = new Bot<MyContext>(token);

    this.bot.use(session({ initial: () => ({}) }));
    this.bot.use(conversations());
    this.bot.use(createConversation(this.addTask.bind(this), 'addTask'));

    this.bot.command('start', (ctx) =>
      ctx.reply(
        '📚 Salom! To-Do Books botiga xush kelibsiz.\n\n' +
          '/add - Vazifa qo‘shish\n' +
          '/tasks - Vazifalar ro‘yxati\n' +
          '/complete - Vazifani bajarilgan deb belgilash\n' +
          '/delete - Vazifani o‘chirish',
      ),
    );

    this.bot.command('add', async (ctx) => {
      await ctx.conversation.enter('addTask');
    });

    this.bot.command('tasks', this.showTasks.bind(this));
    this.bot.command('complete', this.showCompleteButtons.bind(this));
    this.bot.command('delete', this.showDeleteButtons.bind(this));

    this.bot.callbackQuery(/complete_(\d+)/, this.completeTask.bind(this));
    this.bot.callbackQuery(/delete_(\d+)/, this.deleteTask.bind(this));

    this.bot.start();

    this.startReminder();
  }

  private addTask = async (
    conversation: Conversation<MyContext>,
    ctx: MyContext,
  ) => {
    await ctx.reply('Vazifa nomini yuboring:');
    let title: string | undefined;
    while (!title) {
      const { message } = await conversation.wait();
      if (message?.text && TaskValidator.isValidTitle(message.text)) {
        title = message.text.trim();
      } else {
        await ctx.reply(
          'Noto‘g‘ri nom. Kamida 3 ta belgi bo‘lishi kerak.\nMarhamat, qayta kiriting:',
        );
      }
    }

    await ctx.reply('Vazifa vaqtini yuboring (format: dd.mm.yyyy hh:mm):');
    let dueDate: string | undefined;
    while (!dueDate) {
      const { message } = await conversation.wait();
      if (message?.text && TaskValidator.isValidDate(message.text)) {
        dueDate = message.text;
      } else {
        await ctx.reply(
          'Noto‘g‘ri format. Masalan: 22.07.2025 22:30.\nMarhamat, qayta kiriting:',
        );
      }
    }

    const keyboard = new InlineKeyboard()
      .text('Low', 'priority_low')
      .text('Medium', 'priority_medium')
      .text('High', 'priority_high');

    await ctx.reply('Darajani tanlang:', { reply_markup: keyboard });

    let priority: 'low' | 'medium' | 'high' | undefined;
    while (!priority) {
      const callback = await conversation.waitForCallbackQuery([
        'priority_low',
        'priority_medium',
        'priority_high',
      ]);
      if (callback.match === 'priority_low') priority = 'low';
      if (callback.match === 'priority_medium') priority = 'medium';
      if (callback.match === 'priority_high') priority = 'high';

      await callback.answerCallbackQuery();
    }

    await this.taskModel.create({
      userId: ctx.from!.id,
      title,
      dueDate,
      priority,
      isCompleted: false,
      isNotified: false,
    });

    await ctx.reply('Vazifa qo‘shildi!');
  };

  private async showTasks(ctx: MyContext) {
    const userId = ctx.from?.id;
    const tasks = await this.taskModel.findAll({ where: { userId } });

    if (tasks.length === 0) {
      return ctx.reply('Sizda hech qanday vazifa yo‘q.');
    }

    const taskList = tasks
      .map(
        (task, i) =>
          `${i + 1}. ${task.title} | ${task.dueDate} | ${
            task.priority
          } | ${task.isCompleted ? 'Bajarilgan' : ' Faol'}`,
      )
      .join('\n');

    ctx.reply(`📄 Vazifalar:\n${taskList}`);
  }

  private async showCompleteButtons(ctx: MyContext) {
    const tasks = await this.taskModel.findAll({
      where: { userId: ctx.from!.id, isCompleted: false },
    });

    if (tasks.length === 0)
      return ctx.reply('Barcha vazifalar allaqachon bajarilgan!');

    const keyboard = new InlineKeyboard();
    tasks.forEach((t) => keyboard.text(t.title, `complete_${t.id}`).row());

    await ctx.reply('Qaysi vazifani bajarilgan deb belgilaymiz?', {
      reply_markup: keyboard,
    });
  }

  private async completeTask(ctx: MyContext) {
    const taskId = Number(ctx.match![1]);
    const task = await this.taskModel.findByPk(taskId);

    if (!task) return ctx.answerCallbackQuery({ text: 'Vazifa topilmadi.' });

    task.isCompleted = true;
    await task.save();

    await ctx.editMessageText(`"${task.title}" bajarilgan deb belgilandi.`);
    await ctx.answerCallbackQuery();
  }

  private async showDeleteButtons(ctx: MyContext) {
    const tasks = await this.taskModel.findAll({
      where: { userId: ctx.from!.id },
    });

    if (tasks.length === 0) return ctx.reply('Sizda hech qanday vazifa yo‘q.');

    const keyboard = new InlineKeyboard();
    tasks.forEach((t) =>
      keyboard.text(`🗑 ${t.title}`, `delete_${t.id}`).row(),
    );

    await ctx.reply('🗑 Qaysi vazifani o‘chiraylik?', {
      reply_markup: keyboard,
    });
  }

  private async deleteTask(ctx: MyContext) {
    const taskId = Number(ctx.match![1]);
    const task = await this.taskModel.findByPk(taskId);

    if (!task) return ctx.answerCallbackQuery({ text: 'Vazifa topilmadi.' });

    await task.destroy();

    await ctx.editMessageText(`🗑 "${task.title}" muvaffaqiyatli o‘chirildi.`);
    await ctx.answerCallbackQuery();
  }

  private startReminder() {
    setInterval(async () => {
      const now = new Date();
      const tasks = await this.taskModel.findAll({
        where: { isCompleted: false, isNotified: false },
      });

      for (const task of tasks) {
        const [day, month, yearTime] = task.dueDate.split('.');
        const [year, time] = yearTime.split(' ');
        const [hour, minute] = time.split(':');

        const taskDate = new Date(
          `${year}-${month}-${day}T${hour}:${minute}:00`,
        );

        if (taskDate <= now) {
          await this.bot.api.sendMessage(
            task.userId,
            ` Eslatma!\n${task.title} |  ${task.priority}`,
          );
          task.isNotified = true;
          await task.save();
        }
      }
    }, 60 * 1000);
  }
}
