import { Controller, HttpCode, HttpStatus, Param, Patch } from "@nestjs/common";
import { CheckinAppointmentUseCase } from "./application/use-cases/checkin-appointment.use-case";

@Controller("appointments")
export class AppointmentsController {
  constructor(private readonly checkinUseCase: CheckinAppointmentUseCase) {}

  @Patch(":id/status")
  @HttpCode(HttpStatus.OK)
  checkin(@Param("id") id: string) {
    return this.checkinUseCase.execute(id);
  }
}
