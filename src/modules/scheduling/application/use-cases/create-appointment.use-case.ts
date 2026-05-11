export class CreateAppointmentUseCase {
  constructor(
    private readonly appointmentRepository: any,
    private readonly clinicalService: any,
  ) {}

  async execute(input: any): Promise<any> {
    // Regra #1: Verificar conflitos de horário
    const conflicts = await this.appointmentRepository.findConflicts(
      input.funcionarioId,
      input.dataHora,
      input.duracao,
    );

    if (conflicts.length > 0) {
      throw new Error('Profissional já possui agendamento neste horário');
    }

    // Regra #3: Validar vacinas para HOTEL
    if (input.tipo === 'HOTEL') {
      const vaccinationStatus = await this.clinicalService.getVaccinationStatus(input.petId);
      if (!vaccinationStatus.isValid) {
        throw new Error('Agendamento de hotelzinho bloqueado: vacinas vencidas ou ausentes');
      }
    }

    const appointment = await this.appointmentRepository.save(input);
    return appointment;
  }
}
