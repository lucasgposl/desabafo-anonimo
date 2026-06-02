import { validarTextoDesabafo, validarTextoComentario } from '../../utils/validacao';

describe('validarTextoDesabafo', () => {
  it('deve aceitar texto válido', () => {
    const resultado = validarTextoDesabafo('Estou me sentindo triste hoje.');
    expect(resultado.valido).toBe(true);
    expect(resultado.erro).toBeUndefined();
  });

  it('deve rejeitar string vazia', () => {
    const resultado = validarTextoDesabafo('');
    expect(resultado.valido).toBe(false);
    expect(resultado.erro).toBeDefined();
  });

  it('deve rejeitar string com apenas espaços', () => {
    const resultado = validarTextoDesabafo('   ');
    expect(resultado.valido).toBe(false);
    expect(resultado.erro).toBeDefined();
  });

  it('deve rejeitar texto com mais de 2000 caracteres', () => {
    const textoLongo = 'a'.repeat(2001);
    const resultado = validarTextoDesabafo(textoLongo);
    expect(resultado.valido).toBe(false);
    expect(resultado.erro).toContain('2000');
  });

  it('deve aceitar texto com exatamente 2000 caracteres', () => {
    const texto = 'a'.repeat(2000);
    const resultado = validarTextoDesabafo(texto);
    expect(resultado.valido).toBe(true);
  });

  it('deve aceitar texto com 1 caractere', () => {
    const resultado = validarTextoDesabafo('a');
    expect(resultado.valido).toBe(true);
  });
});

describe('validarTextoComentario', () => {
  it('deve aceitar texto válido', () => {
    const resultado = validarTextoComentario('Força!');
    expect(resultado.valido).toBe(true);
    expect(resultado.erro).toBeUndefined();
  });

  it('deve rejeitar string vazia', () => {
    const resultado = validarTextoComentario('');
    expect(resultado.valido).toBe(false);
    expect(resultado.erro).toBeDefined();
  });

  it('deve rejeitar string com apenas espaços', () => {
    const resultado = validarTextoComentario('   \t\n  ');
    expect(resultado.valido).toBe(false);
    expect(resultado.erro).toBeDefined();
  });

  it('deve rejeitar texto com mais de 500 caracteres', () => {
    const textoLongo = 'b'.repeat(501);
    const resultado = validarTextoComentario(textoLongo);
    expect(resultado.valido).toBe(false);
    expect(resultado.erro).toContain('500');
  });

  it('deve aceitar texto com exatamente 500 caracteres', () => {
    const texto = 'b'.repeat(500);
    const resultado = validarTextoComentario(texto);
    expect(resultado.valido).toBe(true);
  });

  it('deve aceitar texto com 1 caractere', () => {
    const resultado = validarTextoComentario('x');
    expect(resultado.valido).toBe(true);
  });
});
