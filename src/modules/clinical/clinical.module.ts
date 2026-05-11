import { Module } from "@nestjs/common";
import { TypeOrmModule } from "@nestjs/typeorm";
import { MedicalRecord, MedicalRecordSupply } from "./domain/entities/medical-record.entity";
import { VaccinationRecord } from "./domain/entities/vaccination-record.entity";

@Module({
  imports: [TypeOrmModule.forFeature([MedicalRecord, MedicalRecordSupply, VaccinationRecord])],
})
export class ClinicalModule {}
