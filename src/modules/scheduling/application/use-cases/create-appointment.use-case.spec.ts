import { CreateAppointmentUseCase } from './create-appointment.use-case';

describe('CreateAppointmentUseCase', () => {
  let useCase: CreateAppointmentUseCase;
  let appointmentRepository: any;
  let clinicalService: any; // Interface simulando a comunicação com o módulo Clínico

  beforeEach(() => {
    appointmentRepository = {
      findConflicts: jest.fn(),
      save: jest.fn(),
    };
    clinicalService = {
      getVaccinationStatus: jest.fn(),
    };
    useCase = new CreateAppointmentUseCase(appointmentRepository, clinicalService);
  });

  const validDate = new Date();
  validDate.setDate(validDate.getDate() + 1); // Amanhã

  it('should create an appointment with success', async () => {
    const input = {
      petId: 'pet-uuid',
      funcionarioId: 'emp-uuid',
      tipo: 'CONSULTATION',
      dataHora: validDate,
      duracao: 30,
    };

    appointmentRepository.findConflicts.mockResolvedValue([]);
    appointmentRepository.save.mockResolvedValue({ id: 'app-uuid', ...input });

    const result = await useCase.execute(input);

    expect(result).toBeDefined();
    expect(appointmentRepository.save).toHaveBeenCalled();
  });

  it('should throw error if professional has schedule conflict', async () => {
    const input = {
      petId: 'pet-uuid',
      funcionarioId: 'emp-uuid',
      tipo: 'CONSULTATION',
      dataHora: validDate,
      duracao: 30,
    };

    appointmentRepository.findConflicts.mockResolvedValue([{ id: 'other-app' }]);

    await expect(useCase.execute(input)).rejects.toThrow(
      'Profissional já possui agendamento neste horário',
    );
  });

  it('should throw error for HOTEL type if vaccines are invalid', async () => {
    const input = {
      petId: 'pet-uuid',
      funcionarioId: 'emp-uuid',
      tipo: 'HOTEL',
      dataHora: validDate,
      duracao: 1440,
    };

    appointmentRepository.findConflicts.mockResolvedValue([]);
    clinicalService.getVaccinationStatus.mockResolvedValue({
      isValid: false,
      expiredVaccines: ['antirabica'],
    });

    await expect(useCase.execute(input)).rejects.toThrow(
      'Agendamento de hotelzinho bloqueado: vacinas vencidas ou ausentes',
    );
  });
});
