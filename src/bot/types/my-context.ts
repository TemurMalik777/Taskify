import { Context } from "grammy";
import { ConversationFlavor } from "@grammyjs/conversations";

// MyContext o'zini o'ziga qo'shib chaqirilmaydi, oddiy yoziladi
export type MyContext = Context & ConversationFlavor<Context>;