import { Entity, PrimaryGeneratedColumn } from "typeorm";

@Entity("medical_records")
export class MedicalRecord {
  @PrimaryGeneratedColumn("uuid")
  id: string;
}

@Entity("medical_record_supplies")
export class MedicalRecordSupply {
  @PrimaryGeneratedColumn("uuid")
  id: string;
}
