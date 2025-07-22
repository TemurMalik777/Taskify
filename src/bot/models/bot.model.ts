import { Column, DataType, Model, Table } from "sequelize-typescript";

interface TaskCreationAttr {
  userId: number;
  title: string;
  dueDate: string;
  priority: "low" | "medium" | "high";
  completed?: boolean
}

@Table({ tableName: "ToBot" })
export class ToBot extends Model {
  @Column({ type: DataType.BIGINT })
  declare userId: number;

  @Column({ type: DataType.STRING })
  declare title: string;

  @Column({ type: DataType.STRING })
  declare dueDate: string;

  @Column({ type: DataType.ENUM("low", "medium", "high") })
  declare priority: "low" | "medium" | "high";

  @Column({ type: DataType.BOOLEAN, defaultValue: false })
  declare isCompleted: boolean;

  @Column({ type: DataType.BOOLEAN, defaultValue: false })
  declare isNotified: boolean;
}
