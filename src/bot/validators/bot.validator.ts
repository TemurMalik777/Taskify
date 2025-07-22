// src/bot/validators/task.validator.ts

export class TaskValidator {
  // ✅ Vazifa nomi kamida 3 ta belgi bo‘lishi kerak
  static isValidTitle(title: string): boolean {
    return typeof title === "string" && title.trim().length >= 3;
  }

  // ✅ Sana va vaqt: dd.mm.yyyy hh:mm
  static isValidDate(dateStr: string): boolean {
    const dateRegex = /^\d{2}\.\d{2}\.\d{4} \d{2}:\d{2}$/;
    return dateRegex.test(dateStr);
  }

  // ✅ Priority: low, medium, high
  static isValidPriority(priority: string): boolean {
    const validPriorities = ["low", "medium", "high"];
    return validPriorities.includes(priority.toLowerCase());
  }
}
