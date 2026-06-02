import { useState, useEffect, useCallback } from 'react';
import { buscarTodosDesabafosAdmin, buscarTodosComentariosAdmin, buscarTodosAdmins, adicionarAdmin, removerAdmin } from '../firebase/admin';
import { removerDesabafo, apagarTodosDesabafos } from '../firebase/desabafos';
import { removerComentario } from '../firebase/comentarios';
import { ConfirmDialog } from './ConfirmDialog';
import { formatarTempoRelativo } from '../utils/tempoRelativo';
import type { DesabafoAdmin, ComentarioAdmin, PaginaModeracaoProps } from '../types';
import './PaginaModeracao.css';

type AcaoConfirmacao =
  | { tipo: 'remover-desabafo'; id: string }
  | { tipo: 'remover-comentario'; desabafoId: string; comentarioId: string }
  | { tipo: 'apagar-tudo' };

export function PaginaModeracao({ isAdmin }: PaginaModeracaoProps) {
  const [desabafos, setDesabafos] = useState<DesabafoAdmin[]>([]);
  const [comentarios, setComentarios] = useState<ComentarioAdmin[]>([]);
  const [admins, setAdmins] = useState<{ uid: string; email: string; criadoEm: Date }[]>([]);
  const [isLoading, setIsLoading] = useState(true);
  const [erro, setErro] = useState<string | null>(null);
  const [acaoConfirmacao, setAcaoConfirmacao] = useState<AcaoConfirmacao | null>(null);
  const [novoAdminEmail, setNovoAdminEmail] = useState('');
  const [novoAdminUid, setNovoAdminUid] = useState('');
  const [isAdicionandoAdmin, setIsAdicionandoAdmin] = useState(false);

  const carregarDados = useCallback(async () => {
    setIsLoading(true);
    setErro(null);
    try {
      console.log('[Moderação] Iniciando carregamento...');
      
      let desabafosData: DesabafoAdmin[] = [];
      let comentariosData: ComentarioAdmin[] = [];
      let adminsData: { uid: string; email: string; criadoEm: Date }[] = [];

      try {
        desabafosData = await buscarTodosDesabafosAdmin();
        console.log('[Moderação] desabafos OK:', desabafosData.length);
      } catch (e) {
        console.error('[Moderação] FALHOU buscarTodosDesabafosAdmin:', e);
        throw e;
      }

      try {
        comentariosData = await buscarTodosComentariosAdmin();
        console.log('[Moderação] comentarios OK:', comentariosData.length);
      } catch (e) {
        console.error('[Moderação] FALHOU buscarTodosComentariosAdmin:', e);
        throw e;
      }

      try {
        adminsData = await buscarTodosAdmins();
        console.log('[Moderação] admins OK:', adminsData.length);
      } catch (e) {
        console.warn('[Moderação] buscarTodosAdmins falhou (ignorado):', e);
      }

      setDesabafos(desabafosData);
      setComentarios(comentariosData);
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

  const truncarTexto = (texto: string, limite: number = 100): string => {
    if (texto.length <= limite) return texto;
    return texto.slice(0, limite) + '…';
  };

  const formatarData = (data: Date): string => {
    return formatarTempoRelativo(data, new Date());
  };

  const traduzirSentimento = (sentimento: string): string => {
    const mapa: Record<string, string> = {
      triste: 'Tristeza',
      raiva: 'Raiva',
      alivio: 'Alívio',
    };
    return mapa[sentimento] || sentimento;
  };

  const handleConfirmar = async () => {
    if (!acaoConfirmacao) return;

    setErro(null);

    try {
      switch (acaoConfirmacao.tipo) {
        case 'remover-desabafo': {
          await removerDesabafo(acaoConfirmacao.id);
          setDesabafos((prev) => prev.filter((d) => d.id !== acaoConfirmacao.id));
          setComentarios((prev) => prev.filter((c) => c.desabafoId !== acaoConfirmacao.id));
          break;
        }
        case 'remover-comentario': {
          await removerComentario(acaoConfirmacao.desabafoId, acaoConfirmacao.comentarioId);
          setComentarios((prev) => prev.filter((c) => c.id !== acaoConfirmacao.comentarioId));
          break;
        }
        case 'apagar-tudo': {
          await apagarTodosDesabafos();
          setDesabafos([]);
          setComentarios([]);
          break;
        }
      }
    } catch {
      setErro('Erro ao remover. Tente novamente.');
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
          disabled={desabafos.length === 0 && comentarios.length === 0}
          type="button"
        >
          Apagar tudo
        </button>
      </div>

      <section className="pagina-moderacao__secao">
        <h2 className="pagina-moderacao__subtitulo">
          Desabafos ({desabafos.length})
        </h2>
        {desabafos.length === 0 ? (
          <p className="pagina-moderacao__vazio">Nenhum desabafo encontrado.</p>
        ) : (
          <ul className="pagina-moderacao__lista">
            {desabafos.map((desabafo) => (
              <li key={desabafo.id} className="pagina-moderacao__item">
                <div className="pagina-moderacao__item-conteudo">
                  <p className="pagina-moderacao__item-texto">
                    {truncarTexto(desabafo.texto)}
                  </p>
                  <div className="pagina-moderacao__item-meta">
                    <span className={`pagina-moderacao__sentimento pagina-moderacao__sentimento--${desabafo.sentimento}`}>
                      {traduzirSentimento(desabafo.sentimento)}
                    </span>
                    <span className="pagina-moderacao__data">
                      {formatarData(desabafo.criadoEm)}
                    </span>
                  </div>
                </div>
                <button
                  className="pagina-moderacao__botao-remover"
                  onClick={() => setAcaoConfirmacao({ tipo: 'remover-desabafo', id: desabafo.id })}
                  type="button"
                  aria-label={`Remover desabafo: ${truncarTexto(desabafo.texto, 30)}`}
                >
                  Remover
                </button>
              </li>
            ))}
          </ul>
        )}
      </section>

      <section className="pagina-moderacao__secao">
        <h2 className="pagina-moderacao__subtitulo">
          Comentários ({comentarios.length})
        </h2>
        {comentarios.length === 0 ? (
          <p className="pagina-moderacao__vazio">Nenhum comentário encontrado.</p>
        ) : (
          <ul className="pagina-moderacao__lista">
            {comentarios.map((comentario) => (
              <li key={comentario.id} className="pagina-moderacao__item">
                <div className="pagina-moderacao__item-conteudo">
                  <p className="pagina-moderacao__item-texto">
                    {truncarTexto(comentario.texto)}
                  </p>
                  <div className="pagina-moderacao__item-meta">
                    <span className="pagina-moderacao__data">
                      {formatarData(comentario.criadoEm)}
                    </span>
                  </div>
                </div>
                <button
                  className="pagina-moderacao__botao-remover"
                  onClick={() =>
                    setAcaoConfirmacao({
                      tipo: 'remover-comentario',
                      desabafoId: comentario.desabafoId,
                      comentarioId: comentario.id,
                    })
                  }
                  type="button"
                  aria-label={`Remover comentário: ${truncarTexto(comentario.texto, 30)}`}
                >
                  Remover
                </button>
              </li>
            ))}
          </ul>
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
                  <p className="pagina-moderacao__item-texto">{admin.email}</p>
                  <div className="pagina-moderacao__item-meta">
                    <span className="pagina-moderacao__data">UID: {admin.uid.slice(0, 12)}...</span>
                  </div>
                </div>
                <button
                  className="pagina-moderacao__botao-remover"
                  onClick={async () => {
                    if (!confirm(`Remover admin ${admin.email}?`)) return;
                    try {
                      await removerAdmin(admin.uid);
                      setAdmins((prev) => prev.filter((a) => a.uid !== admin.uid));
                    } catch {
                      setErro('Erro ao remover admin.');
                    }
                  }}
                  type="button"
                  aria-label={`Remover admin: ${admin.email}`}
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
    </div>
  );
}
