import { Module } from "@nestjs/common";
import { TypeOrmModule } from "@nestjs/typeorm";
import { Appointment } from "./domain/entities/appointment.entity";
import { Budget } from "./domain/entities/budget.entity";
import { AppointmentsController } from "./appointments.controller";
import { CheckinAppointmentUseCase } from "./application/use-cases/checkin-appointment.use-case";

@Module({
  imports: [TypeOrmModule.forFeature([Appointment, Budget])],
  controllers: [AppointmentsController],
  providers: [CheckinAppointmentUseCase],
})
export class SchedulingModule {}
