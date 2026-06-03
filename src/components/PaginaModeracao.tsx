import { useState, useEffect, useCallback } from 'react';
import { buscarTodosDesabafosAdmin, buscarTodosAdmins, adicionarAdmin, removerAdmin, buscarDesabafoAdminPorNumero } from '../firebase/admin';
import { removerDesabafo, apagarTodosDesabafos } from '../firebase/desabafos';
import { removerComentario, buscarComentarios } from '../firebase/comentarios';
import { ConfirmDialog } from './ConfirmDialog';
import { Footer } from './Footer';
import { formatarTempoRelativo } from '../utils/tempoRelativo';
import { obterInfoSentimento } from '../config/sentimentos';
import type { DesabafoAdmin, Comentario, PaginaModeracaoProps } from '../types';
import type { DocumentSnapshot } from 'firebase/firestore';
import './PaginaModeracao.css';

function mascararEmail(email: string): string {
  const [local, dominio] = email.split('@');
  if (!local || !dominio) return '***@***';
  const localMascarado = local.length <= 2
    ? local[0] + '***'
    : local[0] + '***' + local[local.length - 1];
  return `${localMascarado}@***.***`;
}

const LIMITE_MODERACAO = 25;

type AcaoConfirmacao =
  | { tipo: 'remover-desabafo'; id: string }
  | { tipo: 'remover-comentario'; desabafoId: string; comentarioId: string }
  | { tipo: 'apagar-tudo' };

export function PaginaModeracao({ isAdmin }: PaginaModeracaoProps) {
  const [desabafos, setDesabafos] = useState<DesabafoAdmin[]>([]);
  const [admins, setAdmins] = useState<{ uid: string; email: string; criadoEm: Date }[]>([]);
  const [isLoading, setIsLoading] = useState(true);
  const [erro, setErro] = useState<string | null>(null);
  const [acaoConfirmacao, setAcaoConfirmacao] = useState<AcaoConfirmacao | null>(null);
  const [novoAdminEmail, setNovoAdminEmail] = useState('');
  const [novoAdminUid, setNovoAdminUid] = useState('');
  const [isAdicionandoAdmin, setIsAdicionandoAdmin] = useState(false);

  // Pagination states
  const [lastDoc, setLastDoc] = useState<DocumentSnapshot | null>(null);
  const [hasMore, setHasMore] = useState(false);
  const [isLoadingMore, setIsLoadingMore] = useState(false);

  // Inline comments states
  const [expandedDesabafoIds, setExpandedDesabafoIds] = useState<Set<string>>(new Set());
  const [comentariosPorDesabafo, setComentariosPorDesabafo] = useState<Record<string, Comentario[]>>({});
  const [loadingComentarios, setLoadingComentarios] = useState<Record<string, boolean>>({});
  const [erroComentarios, setErroComentarios] = useState<Record<string, string>>({});

  // Search states
  const [buscaNumero, setBuscaNumero] = useState('');
  const [modoBusca, setModoBusca] = useState(false);
  const [isSearching, setIsSearching] = useState(false);
  const [erroBusca, setErroBusca] = useState<string | null>(null);
  const [resultadoBusca, setResultadoBusca] = useState<DesabafoAdmin[]>([]);

  const carregarDados = useCallback(async () => {
    setIsLoading(true);
    setErro(null);
    try {
      console.log('[Moderação] Iniciando carregamento...');

      let adminsData: { uid: string; email: string; criadoEm: Date }[] = [];

      const { desabafos: desabafosData, ultimoDoc } = await buscarTodosDesabafosAdmin(LIMITE_MODERACAO);
      console.log('[Moderação] desabafos OK:', desabafosData.length);

      try {
        adminsData = await buscarTodosAdmins();
        console.log('[Moderação] admins OK:', adminsData.length);
      } catch (e) {
        console.warn('[Moderação] buscarTodosAdmins falhou (ignorado):', e);
      }

      setDesabafos(desabafosData);
      setLastDoc(ultimoDoc);
      setHasMore(desabafosData.length === LIMITE_MODERACAO);
      setAdmins(adminsData);
    } catch (err) {
      const msg = err instanceof Error ? err.message : String(err);
      console.error('[Moderação] Erro ao carregar dados:', err);
      setErro(import.meta.env.DEV ? `Erro: ${msg}` : 'Erro ao carregar dados de moderação.');
    } finally {
      setIsLoading(false);
    }
  }, []);

  useEffect(() => {
    if (isAdmin) {
      carregarDados();
    }
  }, [isAdmin, carregarDados]);

  async function toggleDesabafo(id: string) {
    if (expandedDesabafoIds.has(id)) {
      // Collapse — no fetch
      setExpandedDesabafoIds(prev => {
        const next = new Set(prev);
        next.delete(id);
        return next;
      });
      return;
    }

    // Expand
    setExpandedDesabafoIds(prev => new Set(prev).add(id));

    // Already loaded — reuse cache (Req 2.3)
    if (comentariosPorDesabafo[id]) return;

    // Clear any previous error on retry (Req 2.5)
    if (erroComentarios[id]) {
      setErroComentarios(prev => {
        const next = { ...prev };
        delete next[id];
        return next;
      });
    }

    // First time or retry — fetch from Firestore (Req 2.2)
    setLoadingComentarios(prev => ({ ...prev, [id]: true }));
    try {
      const dados = await buscarComentarios(id);
      setComentariosPorDesabafo(prev => ({ ...prev, [id]: dados }));
    } catch {
      setErroComentarios(prev => ({ ...prev, [id]: 'Erro ao carregar comentários.' }));
    } finally {
      setLoadingComentarios(prev => ({ ...prev, [id]: false }));
    }
  }

  async function carregarMais() {
    if (isLoadingMore || !hasMore) return;

    setIsLoadingMore(true);
    try {
      const { desabafos: novosDesabafos, ultimoDoc } = await buscarTodosDesabafosAdmin(
        LIMITE_MODERACAO,
        lastDoc ?? undefined
      );
      setDesabafos(prev => [...prev, ...novosDesabafos]);
      setLastDoc(ultimoDoc);
      setHasMore(novosDesabafos.length === LIMITE_MODERACAO);
    } catch (err) {
      const msg = err instanceof Error ? err.message : String(err);
      console.error('[Moderação] Erro ao carregar mais:', err);
      setErro(import.meta.env.DEV ? `Erro: ${msg}` : 'Erro ao carregar mais desabafos.');
    } finally {
      setIsLoadingMore(false);
    }
  }

  // Detect whether `numero` field is available in the loaded data (feature-003 dependency)
  const numeroDisponivel = desabafos.some((d) => d.numero !== undefined);

  async function handleBuscar() {
    const valorTrimado = buscaNumero.trim();
    const numero = parseInt(valorTrimado, 10);

    if (!valorTrimado || isNaN(numero) || numero <= 0 || !Number.isInteger(numero)) {
      setErroBusca('Digite um número inteiro positivo válido.');
      return;
    }

    setErroBusca(null);
    setIsSearching(true);
    try {
      const encontrado = await buscarDesabafoAdminPorNumero(numero);
      setResultadoBusca(encontrado ? [encontrado] : []);
      setModoBusca(true);
    } catch (err) {
      const msg = err instanceof Error ? err.message : String(err);
      setErroBusca(import.meta.env.DEV ? `Erro na busca: ${msg}` : 'Erro ao buscar. Tente novamente.');
    } finally {
      setIsSearching(false);
    }
  }

  function handleLimpar() {
    setBuscaNumero('');
    setModoBusca(false);
    setErroBusca(null);
    setResultadoBusca([]);
  }

  const truncarTexto = (texto: string, limite: number = 100): string => {
    if (texto.length <= limite) return texto;
    return texto.slice(0, limite) + '…';
  };

  const formatarData = (data: Date): string => {
    return formatarTempoRelativo(data, new Date());
  };

  const traduzirSentimento = (sentimento: string): string => {
    const info = obterInfoSentimento(sentimento);
    return `${info.emoji} ${info.label}`;
  };

  const handleConfirmar = async () => {
    if (!acaoConfirmacao) return;

    setErro(null);

    try {
      switch (acaoConfirmacao.tipo) {
        case 'remover-desabafo': {
          await removerDesabafo(acaoConfirmacao.id);
          setDesabafos((prev) => prev.filter((d) => d.id !== acaoConfirmacao.id));
          // Clean up inline comments state for removed desabafo
          setComentariosPorDesabafo(prev => {
            const next = { ...prev };
            delete next[acaoConfirmacao.id];
            return next;
          });
          setExpandedDesabafoIds(prev => {
            const next = new Set(prev);
            next.delete(acaoConfirmacao.id);
            return next;
          });
          break;
        }
        case 'remover-comentario': {
          await removerComentario(acaoConfirmacao.desabafoId, acaoConfirmacao.comentarioId);
          // Remove comment from inline list (Req 3.3)
          setComentariosPorDesabafo(prev => ({
            ...prev,
            [acaoConfirmacao.desabafoId]: (prev[acaoConfirmacao.desabafoId] ?? []).filter(
              c => c.id !== acaoConfirmacao.comentarioId
            ),
          }));
          // Decrement badge count immediately (Req 5.2)
          setDesabafos(prev =>
            prev.map(d =>
              d.id === acaoConfirmacao.desabafoId
                ? { ...d, totalComentarios: Math.max(0, d.totalComentarios - 1) }
                : d
            )
          );
          // Also update search results if in search mode
          if (modoBusca) {
            setResultadoBusca(prev =>
              prev.map(d =>
                d.id === acaoConfirmacao.desabafoId
                  ? { ...d, totalComentarios: Math.max(0, d.totalComentarios - 1) }
                  : d
              )
            );
          }
          break;
        }
        case 'apagar-tudo': {
          await apagarTodosDesabafos();
          setDesabafos([]);
          setComentariosPorDesabafo({});
          setExpandedDesabafoIds(new Set());
          setLastDoc(null);
          setHasMore(false);
          break;
        }
      }
    } catch {
      if (acaoConfirmacao.tipo === 'remover-comentario') {
        // Req 3.4: show error and keep the comment visible in the list
        setErro('Erro ao remover comentário. O comentário foi mantido na lista.');
      } else {
        setErro('Erro ao remover. Tente novamente.');
      }
    } finally {
      setAcaoConfirmacao(null);
    }
  };

  const handleCancelar = () => {
    setAcaoConfirmacao(null);
  };

  const getMensagemConfirmacao = (): string => {
    if (!acaoConfirmacao) return '';
    switch (acaoConfirmacao.tipo) {
      case 'remover-desabafo':
        return 'Tem certeza que deseja remover este desabafo e todos os seus comentários?';
      case 'remover-comentario':
        return 'Tem certeza que deseja remover este comentário?';
      case 'apagar-tudo':
        return 'Tem certeza que deseja apagar TODOS os desabafos e comentários? Esta ação não pode ser desfeita.';
    }
  };

  if (!isAdmin) {
    return null;
  }

  if (isLoading) {
    return (
      <div className="pagina-moderacao">
        <p className="pagina-moderacao__loading">Carregando dados de moderação...</p>
      </div>
    );
  }

  return (
    <div className="pagina-moderacao">
      <h1 className="pagina-moderacao__titulo">Moderação</h1>

      {erro && (
        <div className="pagina-moderacao__erro" role="alert">
          {erro}
        </div>
      )}

      <div className="pagina-moderacao__acoes-globais">
        <button
          className="pagina-moderacao__botao-apagar-tudo"
          onClick={() => setAcaoConfirmacao({ tipo: 'apagar-tudo' })}
          disabled={desabafos.length === 0}
          type="button"
        >
          Apagar tudo
        </button>
      </div>

      <section className="pagina-moderacao__secao">
        <h2 className="pagina-moderacao__subtitulo">
          Desabafos ({desabafos.length}{hasMore ? '+' : ''})
        </h2>

        {/* Search bar */}
        <div className="pagina-moderacao__busca">
          <input
            type="number"
            placeholder={numeroDisponivel ? 'Buscar por número...' : 'Busca por número (disponível em breve)'}
            value={buscaNumero}
            onChange={(e) => {
              setBuscaNumero(e.target.value);
              setErroBusca(null);
              if (!e.target.value) {
                setModoBusca(false);
                setResultadoBusca([]);
              }
            }}
            onKeyDown={(e) => {
              if (e.key === 'Enter' && numeroDisponivel) handleBuscar();
            }}
            disabled={!numeroDisponivel || isSearching}
            className="pagina-moderacao__busca-input"
            aria-label="Buscar desabafo por número"
            min={1}
          />
          <button
            type="button"
            className="pagina-moderacao__busca-botao pagina-moderacao__busca-botao--buscar"
            onClick={handleBuscar}
            disabled={!numeroDisponivel || isSearching || !buscaNumero.trim()}
          >
            {isSearching ? 'Buscando...' : 'Buscar'}
          </button>
          <button
            type="button"
            className="pagina-moderacao__busca-botao pagina-moderacao__busca-botao--limpar"
            onClick={handleLimpar}
            disabled={!modoBusca && !buscaNumero}
          >
            Limpar
          </button>
        </div>
        {erroBusca && (
          <p className="pagina-moderacao__busca-erro" role="alert">
            {erroBusca}
          </p>
        )}

        {(() => {
          const listaExibida = modoBusca ? resultadoBusca : desabafos;
          if (modoBusca && listaExibida.length === 0) {
            return (
              <p className="pagina-moderacao__vazio">
                Nenhum desabafo encontrado com o número informado.
              </p>
            );
          }
          if (!modoBusca && listaExibida.length === 0) {
            return <p className="pagina-moderacao__vazio">Nenhum desabafo encontrado.</p>;
          }
          return (
          <ul className="pagina-moderacao__lista">
            {listaExibida.map((desabafo) => (
              <li key={desabafo.id} className="pagina-moderacao__item">
                <div className="pagina-moderacao__item-conteudo">
                  <p className="pagina-moderacao__item-texto">
                    {desabafo.numero !== undefined && (
                      <span className="pagina-moderacao__numero">#{desabafo.numero}</span>
                    )}
                    {truncarTexto(desabafo.texto)}
                  </p>
                  <div className="pagina-moderacao__item-meta">
                    <span className={`pagina-moderacao__sentimento pagina-moderacao__sentimento--${obterInfoSentimento(desabafo.sentimento).categoria ?? 'legado'}`}>
                      {traduzirSentimento(desabafo.sentimento)}
                    </span>
                    <span className="pagina-moderacao__data">
                      {formatarData(desabafo.criadoEm)}
                    </span>
                  </div>
                </div>
                <div className="pagina-moderacao__item-acoes">
                  {/* Toggle button — fully styled in Task 4 */}
                  <button
                    type="button"
                    className="pagina-moderacao__desabafo-toggle"
                    onClick={() => toggleDesabafo(desabafo.id)}
                    disabled={desabafo.totalComentarios === 0}
                    aria-expanded={expandedDesabafoIds.has(desabafo.id)}
                    aria-label={`${desabafo.totalComentarios} comentário${desabafo.totalComentarios !== 1 ? 's' : ''}`}
                  >
                    <span className={`pagina-moderacao__badge-comentarios${desabafo.totalComentarios === 0 ? ' pagina-moderacao__badge-comentarios--vazio' : ''}`}>
                      {loadingComentarios[desabafo.id]
                        ? 'carregando...'
                        : `${desabafo.totalComentarios} comentário${desabafo.totalComentarios !== 1 ? 's' : ''}`}
                    </span>
                    {desabafo.totalComentarios > 0 && (
                      <span aria-hidden="true">
                        {expandedDesabafoIds.has(desabafo.id) ? ' ▼' : ' ▶'}
                      </span>
                    )}
                  </button>
                  <button
                    className="pagina-moderacao__botao-remover"
                    onClick={() => setAcaoConfirmacao({ tipo: 'remover-desabafo', id: desabafo.id })}
                    type="button"
                    aria-label={`Remover desabafo: ${truncarTexto(desabafo.texto, 30)}`}
                  >
                    Remover
                  </button>
                </div>
                {/* Inline comments — rendered in Task 5/6 */}
                {expandedDesabafoIds.has(desabafo.id) && (
                  <div className="pagina-moderacao__comentarios-inline">
                    {erroComentarios[desabafo.id] ? (
                      <p className="pagina-moderacao__erro-inline" role="alert">
                        {erroComentarios[desabafo.id]}
                      </p>
                    ) : loadingComentarios[desabafo.id] ? (
                      <p className="pagina-moderacao__loading-inline">Carregando comentários...</p>
                    ) : (comentariosPorDesabafo[desabafo.id] ?? []).length === 0 ? (
                      <p className="pagina-moderacao__vazio">Nenhum comentário.</p>
                    ) : (
                      <ul className="pagina-moderacao__lista-comentarios-inline">
                        {(comentariosPorDesabafo[desabafo.id] ?? []).map((comentario) => (
                          <li key={comentario.id} className="pagina-moderacao__comentario-inline-item">
                            <span className="pagina-moderacao__comentario-inline-texto">
                              {truncarTexto(comentario.texto)} — {formatarData(comentario.criadoEm)}
                            </span>
                            <button
                              type="button"
                              className="pagina-moderacao__botao-remover"
                              onClick={() => setAcaoConfirmacao({
                                tipo: 'remover-comentario',
                                desabafoId: desabafo.id,
                                comentarioId: comentario.id,
                              })}
                              aria-label={`Remover comentário: ${truncarTexto(comentario.texto, 30)}`}
                            >
                              Remover
                            </button>
                          </li>
                        ))}
                      </ul>
                    )}
                  </div>
                )}
              </li>
            ))}
          </ul>
          );
        })()}

        {!modoBusca && hasMore && (
          <div className="pagina-moderacao__carregar-mais">
            <button
              type="button"
              onClick={carregarMais}
              disabled={isLoadingMore}
              className="pagina-moderacao__botao-carregar-mais"
            >
              {isLoadingMore ? 'Carregando...' : `Carregar mais ${LIMITE_MODERACAO}`}
            </button>
          </div>
        )}
      </section>

      <section className="pagina-moderacao__secao">
        <h2 className="pagina-moderacao__subtitulo">
          Administradores ({admins.length})
        </h2>

        <div className="pagina-moderacao__admin-form">
          <input
            type="text"
            placeholder="UID do novo admin"
            value={novoAdminUid}
            onChange={(e) => setNovoAdminUid(e.target.value)}
            className="pagina-moderacao__admin-input"
          />
          <input
            type="email"
            placeholder="Email do novo admin"
            value={novoAdminEmail}
            onChange={(e) => setNovoAdminEmail(e.target.value)}
            className="pagina-moderacao__admin-input"
          />
          <button
            className="pagina-moderacao__botao-adicionar-admin"
            onClick={async () => {
              if (!novoAdminUid.trim() || !novoAdminEmail.trim()) return;
              setIsAdicionandoAdmin(true);
              setErro(null);
              try {
                await adicionarAdmin(novoAdminUid.trim(), novoAdminEmail.trim());
                setAdmins((prev) => [...prev, { uid: novoAdminUid.trim(), email: novoAdminEmail.trim(), criadoEm: new Date() }]);
                setNovoAdminUid('');
                setNovoAdminEmail('');
              } catch {
                setErro('Erro ao adicionar admin.');
              } finally {
                setIsAdicionandoAdmin(false);
              }
            }}
            disabled={isAdicionandoAdmin || !novoAdminUid.trim() || !novoAdminEmail.trim()}
            type="button"
          >
            {isAdicionandoAdmin ? 'Adicionando...' : 'Adicionar Admin'}
          </button>
        </div>

        {admins.length === 0 ? (
          <p className="pagina-moderacao__vazio">Nenhum admin encontrado.</p>
        ) : (
          <ul className="pagina-moderacao__lista">
            {admins.map((admin) => (
              <li key={admin.uid} className="pagina-moderacao__item">
                <div className="pagina-moderacao__item-conteudo">
                  <p className="pagina-moderacao__item-texto">{mascararEmail(admin.email)}</p>
                  <div className="pagina-moderacao__item-meta">
                    <span className="pagina-moderacao__data">UID: {admin.uid.slice(0, 12)}...</span>
                  </div>
                </div>
                <button
                  className="pagina-moderacao__botao-remover"
                  onClick={async () => {
                    if (!confirm(`Remover admin ${mascararEmail(admin.email)}?`)) return;
                    try {
                      await removerAdmin(admin.uid);
                      setAdmins((prev) => prev.filter((a) => a.uid !== admin.uid));
                    } catch {
                      setErro('Erro ao remover admin.');
                    }
                  }}
                  type="button"
                  aria-label={`Remover admin: ${mascararEmail(admin.email)}`}
                >
                  Remover
                </button>
              </li>
            ))}
          </ul>
        )}
      </section>

      <ConfirmDialog
        isOpen={acaoConfirmacao !== null}
        mensagem={getMensagemConfirmacao()}
        onConfirmar={handleConfirmar}
        onCancelar={handleCancelar}
      />

      <Footer />
    </div>
  );
}


