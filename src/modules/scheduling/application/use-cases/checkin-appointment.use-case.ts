import {
  ConflictException,
  Injectable,
  NotFoundException,
  UnprocessableEntityException,
} from "@nestjs/common";
import { InjectRepository } from "@nestjs/typeorm";
import { Repository } from "typeorm";
import {
  Appointment,
  AppointmentStatus,
} from "../../domain/entities/appointment.entity";
import { Budget, BudgetStatus } from "../../domain/entities/budget.entity";

const VALID_CHECKIN_STATUSES: AppointmentStatus[] = [
  AppointmentStatus.PENDENTE,
  AppointmentStatus.CONFIRMADO,
];

@Injectable()
export class CheckinAppointmentUseCase {
  constructor(
    @InjectRepository(Appointment)
    private readonly appointmentRepo: Repository<Appointment>,
    @InjectRepository(Budget)
    private readonly budgetRepo: Repository<Budget>,
  ) {}

  async execute(appointmentId: string): Promise<Appointment> {
    const appointment = await this.appointmentRepo.findOne({
      where: { id: appointmentId },
    });

    if (!appointment) {
      throw new NotFoundException(
        `Agendamento com ID "${appointmentId}" não encontrado.`,
      );
    }

    if (!VALID_CHECKIN_STATUSES.includes(appointment.status)) {
      throw new ConflictException(
        `Check-in não permitido: o agendamento está com status "${appointment.status}".`,
      );
    }

    // RN02: orçamento vinculado deve estar aprovado para iniciar o atendimento
    const budget = await this.budgetRepo.findOne({ where: { appointmentId } });

    if (!budget || budget.status !== BudgetStatus.APROVADO) {
      throw new UnprocessableEntityException(
        "Check-in não autorizado: o orçamento vinculado ao agendamento não está aprovado.",
      );
    }

    appointment.status = AppointmentStatus.EM_ANDAMENTO;
    return this.appointmentRepo.save(appointment);
  }
}
