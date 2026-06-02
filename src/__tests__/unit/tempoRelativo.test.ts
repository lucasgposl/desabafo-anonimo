import { formatarTempoRelativo } from '../../utils/tempoRelativo';

describe('formatarTempoRelativo', () => {
  const agora = new Date('2024-06-15T12:00:00Z');

  it('deve retornar "agora" para diferença menor que 60 segundos', () => {
    const data = new Date('2024-06-15T11:59:30Z'); // 30s atrás
    expect(formatarTempoRelativo(data, agora)).toBe('agora');
  });

  it('deve retornar "agora" para diferença de 0 segundos', () => {
    expect(formatarTempoRelativo(agora, agora)).toBe('agora');
  });

  it('deve retornar "agora" para diferença de 59 segundos', () => {
    const data = new Date('2024-06-15T11:59:01Z');
    expect(formatarTempoRelativo(data, agora)).toBe('agora');
  });

  it('deve retornar "1 min atrás" para diferença de exatamente 60 segundos', () => {
    const data = new Date('2024-06-15T11:59:00Z');
    expect(formatarTempoRelativo(data, agora)).toBe('1 min atrás');
  });

  it('deve retornar minutos truncados para diferença entre 60s e 3600s', () => {
    const data = new Date('2024-06-15T11:45:00Z'); // 15 min atrás
    expect(formatarTempoRelativo(data, agora)).toBe('15 min atrás');
  });

  it('deve retornar "59 min atrás" para diferença de 59 minutos e 59 segundos', () => {
    const data = new Date('2024-06-15T11:00:01Z'); // 59min 59s atrás
    expect(formatarTempoRelativo(data, agora)).toBe('59 min atrás');
  });

  it('deve retornar "1 h atrás" para diferença de exatamente 3600 segundos', () => {
    const data = new Date('2024-06-15T11:00:00Z');
    expect(formatarTempoRelativo(data, agora)).toBe('1 h atrás');
  });

  it('deve retornar horas truncadas para diferença entre 3600s e 86400s', () => {
    const data = new Date('2024-06-15T06:00:00Z'); // 6h atrás
    expect(formatarTempoRelativo(data, agora)).toBe('6 h atrás');
  });

  it('deve retornar "23 h atrás" para diferença de 23 horas e 59 minutos', () => {
    const data = new Date('2024-06-14T12:01:00Z'); // 23h 59min atrás
    expect(formatarTempoRelativo(data, agora)).toBe('23 h atrás');
  });

  it('deve retornar data formatada dd/MM/yyyy para diferença >= 86400 segundos', () => {
    const data = new Date('2024-06-14T12:00:00Z'); // exatamente 24h atrás
    expect(formatarTempoRelativo(data, agora)).toBe('14/06/2024');
  });

  it('deve retornar data formatada para datas muito antigas', () => {
    const data = new Date('2023-01-05T10:00:00Z');
    expect(formatarTempoRelativo(data, agora)).toBe('05/01/2023');
  });

  it('deve formatar dia e mês com zero à esquerda', () => {
    const data = new Date('2024-03-02T12:00:00Z');
    expect(formatarTempoRelativo(data, agora)).toBe('02/03/2024');
  });
});
