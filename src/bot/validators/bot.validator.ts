
export class TaskValidator {
  static isValidTitle(title: string): boolean {
    return typeof title === "string" && title.trim().length >= 3;
  }

  static isValidDate(dateStr: string): boolean {
    const dateRegex = /^\d{2}\.\d{2}\.\d{4} \d{2}:\d{2}$/;
    return dateRegex.test(dateStr);
  }

  static isValidPriority(priority: string): boolean {
    const validPriorities = ["low", "medium", "high"];
    return validPriorities.includes(priority.toLowerCase());
  }
}
