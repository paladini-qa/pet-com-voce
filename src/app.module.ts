import { Module } from "@nestjs/common";
import { TypeOrmModule } from "@nestjs/typeorm";
import { Employee } from "./modules/identity-access/domain/entities/employee.entity";
import { Pet } from "./modules/identity-access/domain/entities/pet.entity";
import { Tutor } from "./modules/identity-access/domain/entities/tutor.entity";
import { MedicalRecord, MedicalRecordSupply } from "./modules/clinical/domain/entities/medical-record.entity";
import { VaccinationRecord } from "./modules/clinical/domain/entities/vaccination-record.entity";
import { Appointment } from "./modules/scheduling/domain/entities/appointment.entity";
import { Budget } from "./modules/scheduling/domain/entities/budget.entity";
import { IdentityAccessModule } from "./modules/identity-access/identity-access.module";
import { ClinicalModule } from "./modules/clinical/clinical.module";
import { SchedulingModule } from "./modules/scheduling/scheduling.module";

@Module({
  imports: [
    TypeOrmModule.forRoot({
      type: "postgres",
      host: process.env.DB_HOST,
      port: Number(process.env.DB_PORT),
      username: process.env.DB_USERNAME,
      password: process.env.DB_PASSWORD,
      database: process.env.DB_DATABASE,
      entities: [
        Tutor,
        Pet,
        Employee,
        MedicalRecord,
        MedicalRecordSupply,
        VaccinationRecord,
        Appointment,
        Budget,
      ],
      synchronize: process.env.NODE_ENV !== "production",
    }),
    IdentityAccessModule,
    ClinicalModule,
    SchedulingModule,
  ],
})
export class AppModule {}
