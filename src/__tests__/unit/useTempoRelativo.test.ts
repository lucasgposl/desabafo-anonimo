import { renderHook, act } from '@testing-library/react';
import { useTempoRelativo } from '../../hooks/useTempoRelativo';

describe('useTempoRelativo', () => {
  beforeEach(() => {
    jest.useFakeTimers();
  });

  afterEach(() => {
    jest.useRealTimers();
  });

  it('retorna "agora" para datas com menos de 60 segundos de diferença', () => {
    const agora = new Date();
    const data = new Date(agora.getTime() - 30_000); // 30 segundos atrás

    jest.setSystemTime(agora);
    const { result } = renderHook(() => useTempoRelativo(data));

    expect(result.current).toBe('agora');
  });

  it('retorna "X min atrás" para datas entre 60s e 60min', () => {
    const agora = new Date();
    const data = new Date(agora.getTime() - 5 * 60_000); // 5 minutos atrás

    jest.setSystemTime(agora);
    const { result } = renderHook(() => useTempoRelativo(data));

    expect(result.current).toBe('5 min atrás');
  });

  it('retorna "X h atrás" para datas entre 60min e 24h', () => {
    const agora = new Date();
    const data = new Date(agora.getTime() - 3 * 3_600_000); // 3 horas atrás

    jest.setSystemTime(agora);
    const { result } = renderHook(() => useTempoRelativo(data));

    expect(result.current).toBe('3 h atrás');
  });

  it('retorna "dd/MM/yyyy" para datas com 24h ou mais', () => {
    const agora = new Date('2024-06-15T12:00:00');
    const data = new Date('2024-06-10T10:00:00'); // 5 dias atrás

    jest.setSystemTime(agora);
    const { result } = renderHook(() => useTempoRelativo(data));

    expect(result.current).toBe('10/06/2024');
  });

  it('atualiza o valor a cada 60 segundos', () => {
    const agora = new Date('2024-06-15T12:00:00');
    // 50 segundos atrás — deve ser "agora"
    const data = new Date(agora.getTime() - 50_000);

    jest.setSystemTime(agora);
    const { result } = renderHook(() => useTempoRelativo(data));

    expect(result.current).toBe('agora');

    // Avança 60 segundos — agora a diferença é 110s → "1 min atrás"
    act(() => {
      jest.advanceTimersByTime(60_000);
    });

    expect(result.current).toBe('1 min atrás');
  });

  it('limpa o intervalo ao desmontar', () => {
    const agora = new Date();
    const data = new Date(agora.getTime() - 30_000);

    jest.setSystemTime(agora);
    const { unmount } = renderHook(() => useTempoRelativo(data));

    const clearIntervalSpy = jest.spyOn(global, 'clearInterval');
    unmount();

    expect(clearIntervalSpy).toHaveBeenCalled();
    clearIntervalSpy.mockRestore();
  });
});
