
export class TaskValidator {
  static isValidTitle(title: string): boolean {
    return typeof title === "string" && title.trim().length >= 3;
  }

    static isValidDate(dateStr: string): boolean {
    const regex = /^([0-2]\d|3[01])\.(0\d|1[0-2])\.(\d{4}) ([0-1]\d|2[0-3]):([0-5]\d)$/;
    if (!regex.test(dateStr)) return false;

    const [day, month, yearTime] = dateStr.split(".");
    const [year, time] = yearTime.split(" ");
    const [hour, minute] = time.split(":");

    const taskDate = new Date(`${year}-${month}-${day}T${hour}:${minute}:00`);
    const now = new Date();

    return taskDate.getTime() > now.getTime();
  }

  static isValidPriority(priority: string): boolean {
    const validPriorities = ["low", "medium", "high"];
    return validPriorities.includes(priority.toLowerCase());
  }
}
