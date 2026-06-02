import { calcularTotalInteracoes, ordenarPorPopularidade, paginar } from '../../utils/trends';
import { Desabafo } from '../../types';
import { sentimentoPadrao, criarReacoesZeradas, criarReacoesMock } from '../helpers/fixtureHelper';

function criarDesabafo(overrides: Partial<Desabafo> = {}): Desabafo {
  return {
    id: '1',
    texto: 'Teste',
    sentimento: sentimentoPadrao(),
    criadoEm: new Date('2024-01-15'),
    reacoes: criarReacoesZeradas(),
    totalComentarios: 0,
    ...overrides,
  };
}

describe('calcularTotalInteracoes', () => {
  it('deve somar todos os campos corretamente', () => {
    const desabafo = criarDesabafo({
      reacoes: criarReacoesMock({ apoio: 5, forca: 3, pouco: 2 }),
      totalComentarios: 4,
    });
    expect(calcularTotalInteracoes(desabafo)).toBe(14);
  });

  it('deve retornar 0 quando todos os campos são 0', () => {
    const desabafo = criarDesabafo();
    expect(calcularTotalInteracoes(desabafo)).toBe(0);
  });

  it('deve tratar campos ausentes como 0', () => {
    const desabafo = criarDesabafo({
      reacoes: undefined as any,
      totalComentarios: undefined as any,
    });
    expect(calcularTotalInteracoes(desabafo)).toBe(0);
  });
});

describe('ordenarPorPopularidade', () => {
  it('deve ordenar por total de interações decrescente', () => {
    const desabafos = [
      criarDesabafo({ id: 'a', reacoes: criarReacoesMock({ apoio: 1, forca: 0, pouco: 0 }), totalComentarios: 0 }),
      criarDesabafo({ id: 'b', reacoes: criarReacoesMock({ apoio: 5, forca: 3, pouco: 2 }), totalComentarios: 4 }),
      criarDesabafo({ id: 'c', reacoes: criarReacoesMock({ apoio: 2, forca: 1, pouco: 0 }), totalComentarios: 1 }),
    ];

    const resultado = ordenarPorPopularidade(desabafos);
    expect(resultado.map(d => d.id)).toEqual(['b', 'c', 'a']);
  });

  it('deve usar criadoEm como tiebreaker (mais recente primeiro)', () => {
    const desabafos = [
      criarDesabafo({ id: 'antigo', criadoEm: new Date('2024-01-01'), reacoes: criarReacoesMock({ apoio: 5, forca: 0, pouco: 0 }), totalComentarios: 0 }),
      criarDesabafo({ id: 'recente', criadoEm: new Date('2024-01-15'), reacoes: criarReacoesMock({ apoio: 5, forca: 0, pouco: 0 }), totalComentarios: 0 }),
    ];

    const resultado = ordenarPorPopularidade(desabafos);
    expect(resultado.map(d => d.id)).toEqual(['recente', 'antigo']);
  });

  it('não deve mutar o array original', () => {
    const desabafos = [
      criarDesabafo({ id: 'a', reacoes: criarReacoesMock({ apoio: 10, forca: 0, pouco: 0 }) }),
      criarDesabafo({ id: 'b', reacoes: criarReacoesMock({ apoio: 1, forca: 0, pouco: 0 }) }),
    ];

    const original = [...desabafos];
    ordenarPorPopularidade(desabafos);
    expect(desabafos).toEqual(original);
  });

  it('deve retornar array vazio quando a entrada é vazia', () => {
    expect(ordenarPorPopularidade([])).toEqual([]);
  });
});

describe('paginar', () => {
  const items = [1, 2, 3, 4, 5, 6, 7, 8, 9, 10, 11, 12, 13, 14, 15];

  it('deve retornar os primeiros 10 itens para página 1', () => {
    expect(paginar(items, 1)).toEqual([1, 2, 3, 4, 5, 6, 7, 8, 9, 10]);
  });

  it('deve retornar os itens restantes para página 2', () => {
    expect(paginar(items, 2)).toEqual([11, 12, 13, 14, 15]);
  });

  it('deve retornar array vazio para página além do limite', () => {
    expect(paginar(items, 3)).toEqual([]);
  });

  it('deve aceitar tamanhoPagina customizado', () => {
    expect(paginar(items, 1, 5)).toEqual([1, 2, 3, 4, 5]);
    expect(paginar(items, 2, 5)).toEqual([6, 7, 8, 9, 10]);
    expect(paginar(items, 3, 5)).toEqual([11, 12, 13, 14, 15]);
  });

  it('deve retornar array vazio para array vazio', () => {
    expect(paginar([], 1)).toEqual([]);
  });
});
