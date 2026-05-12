import {
  Column,
  CreateDateColumn,
  Entity,
  ManyToOne,
  PrimaryGeneratedColumn,
  UpdateDateColumn,
} from "typeorm";
import { Appointment } from "./appointment.entity";

export enum BudgetStatus {
  PENDENTE = "PENDENTE",
  APROVADO = "APROVADO",
  REJEITADO = "REJEITADO",
}

@Entity("budgets")
export class Budget {
  @PrimaryGeneratedColumn("uuid")
  id: string;

  @ManyToOne(() => Appointment, { onDelete: "CASCADE" })
  appointment: Appointment;

  @Column()
  appointmentId: string;

  @Column({ type: "decimal", precision: 10, scale: 2 })
  valor: number;

  @Column({
    type: "enum",
    enum: BudgetStatus,
    default: BudgetStatus.PENDENTE,
  })
  status: BudgetStatus;

  @CreateDateColumn()
  createdAt: Date;

  @UpdateDateColumn()
  updatedAt: Date;
}
