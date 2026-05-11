import {
  Column,
  CreateDateColumn,
  Entity,
  ManyToOne,
  PrimaryGeneratedColumn,
  UpdateDateColumn,
} from "typeorm";
import { Employee } from "../../../identity-access/domain/entities/employee.entity";
import { Pet } from "../../../identity-access/domain/entities/pet.entity";

export enum AppointmentType {
  HOTEL = "HOTEL",
  CONSULTA = "CONSULTA",
  BANHO_TOSA = "BANHO_TOSA",
  VACINA = "VACINA",
}

export enum AppointmentStatus {
  PENDENTE = "PENDENTE",
  CONFIRMADO = "CONFIRMADO",
  CANCELADO = "CANCELADO",
  CONCLUIDO = "CONCLUIDO",
}

@Entity("appointments")
export class Appointment {
  @PrimaryGeneratedColumn("uuid")
  id: string;

  @Column({ type: "timestamptz" })
  dataHora: Date;

  @Column({ type: "int" })
  duracao: number;

  @Column({ type: "enum", enum: AppointmentType })
  tipo: AppointmentType;

  @Column({
    type: "enum",
    enum: AppointmentStatus,
    default: AppointmentStatus.PENDENTE,
  })
  status: AppointmentStatus;

  @ManyToOne(() => Pet)
  pet: Pet;

  @Column()
  petId: string;

  @ManyToOne(() => Employee)
  funcionario: Employee;

  @Column()
  funcionarioId: string;

  @Column({ type: "text", nullable: true })
  observacoes: string | null;

  @CreateDateColumn()
  createdAt: Date;

  @UpdateDateColumn()
  updatedAt: Date;
}
