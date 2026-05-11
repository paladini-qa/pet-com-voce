import { Module } from "@nestjs/common";
import { TypeOrmModule } from "@nestjs/typeorm";
import { Appointment } from "./domain/entities/appointment.entity";

@Module({
  imports: [TypeOrmModule.forFeature([Appointment])],
})
export class SchedulingModule {}
