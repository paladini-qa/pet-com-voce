import { Entity, PrimaryGeneratedColumn } from "typeorm";

@Entity("vaccination_records")
export class VaccinationRecord {
  @PrimaryGeneratedColumn("uuid")
  id: string;
}
