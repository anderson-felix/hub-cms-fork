import { GetServerSideProps } from 'next';
import { ChangeEvent, useEffect, useRef, useState } from 'react';
import { useToast } from '@chakra-ui/react';
import { AlertTriangle, CheckCircle2, Circle, FileJson, Loader2, Upload, XCircle } from 'lucide-react';

import { cookieManager, logError, sortGrades } from '@/_base/utils';
import { getProfile } from '@/_base/services/user';
import { getAvailableGrades } from '@/_base/services/admin';
import { listPermissions } from '@/_base/services/permissions';
import { createForm, listForms } from '@/_base/services/form';
import { IHubPermission } from '@/_base/interfaces/permission';
import { IHubFormQuestion, IRegisterHubFormParams } from '@/_base/interfaces/form';
import { IHubUser } from '@/_base/interfaces/user';
import { PageHeader } from '@/components/dashboard/PageHeader';
import { Field, MultiSelect } from '@/components/ui/form-controls';
import { SubmitButton } from '@/components/ui/form-buttons';

interface IProps {
  user: IHubUser;
}

type SendStatus = 'idle' | 'sending' | 'done' | 'error';

type ImportItem = {
  index: number;
  title: string;
  payload: IRegisterHubFormParams | null;
  /** Blocking problems: the item can't be sent while there are any. */
  errors: string[];
  /** Non-blocking notices (e.g. a form with the same title already exists). */
  warnings: string[];
  questionTitles: string[];
  gradesLabel: string;
  status: SendStatus;
  sendError?: string;
};

const norm = (s: string) => s.trim().toLowerCase();
const isObject = (v: unknown): v is Record<string, unknown> => !!v && typeof v === 'object' && !Array.isArray(v);

/**
 * Validates one raw JSON item against what the backend (Joi) accepts on `POST /form`, so problems show up
 * in the preview instead of as 400s halfway through the import.
 */
function buildItem(
  raw: unknown,
  index: number,
  availableGrades: string[] | null,
  existingTitles: Set<string>,
  chosenPermissions: string[],
): ImportItem {
  const errors: string[] = [];
  const warnings: string[] = [];
  const item = isObject(raw) ? raw : {};
  if (!isObject(raw)) errors.push('Item não é um objeto.');

  const title = typeof item.title === 'string' ? item.title.trim() : '';
  if (!title) errors.push('Título obrigatório.');

  const description = item.description == null ? null : typeof item.description === 'string' ? item.description : undefined;
  if (description === undefined) errors.push('Descrição deve ser texto ou nulo.');

  // The API field is spelled `quetions` (sic). Accept the correct spelling too, and normalise it on send.
  const rawQuestions = Array.isArray(item.quetions) ? item.quetions : Array.isArray(item.questions) ? item.questions : null;
  const questions: IHubFormQuestion[] = [];
  if (!rawQuestions || rawQuestions.length === 0) errors.push('Nenhuma pergunta (campo "quetions").');
  else {
    const seen = new Set<string>();
    rawQuestions.forEach((q, i) => {
      const n = i + 1;
      if (!isObject(q)) return errors.push(`Pergunta ${n}: não é um objeto.`);
      const id = typeof q.id === 'string' ? q.id.trim() : '';
      const qTitle = typeof q.title === 'string' ? q.title.trim() : '';
      if (!id) errors.push(`Pergunta ${n}: "id" obrigatório.`);
      else if (seen.has(id)) errors.push(`Pergunta ${n}: id "${id}" repetido.`);
      seen.add(id);
      if (!qTitle) errors.push(`Pergunta ${n}: "title" obrigatório.`);
      if (q.description != null && typeof q.description !== 'string') errors.push(`Pergunta ${n}: "description" deve ser texto ou nulo.`);
      questions.push({ id, title: qTitle, description: (q.description as string | null | undefined) ?? null });
    });
  }

  const rawGrades = Array.isArray(item.grades) ? item.grades : [];
  const grades: string[] = [];
  if (rawGrades.length === 0) errors.push('Informe ao menos uma série em "grades".');
  rawGrades.forEach((g) => {
    if (typeof g !== 'string' || !g.trim()) return errors.push('Série inválida em "grades".');
    const match = availableGrades?.find((a) => norm(a) === norm(g));
    if (availableGrades && !match) errors.push(`Série "${g}" não existe no sistema (válidas: ${availableGrades.join(', ')}).`);
    else grades.push(match ?? g.trim());
  });
  if (!availableGrades) warnings.push('Não foi possível conferir as séries com o servidor.');

  const ownPermissions = Array.isArray(item.permissions) ? item.permissions.filter((p): p is string => typeof p === 'string') : [];
  const permissions = chosenPermissions.length ? chosenPermissions : ownPermissions;

  if (title && existingTitles.has(norm(title))) warnings.push('Já existe uma avaliação com esse título (será criada de novo).');

  const ok = errors.length === 0;
  return {
    index,
    title: title || `(item ${index + 1} sem título)`,
    payload: ok ? { title, description, quetions: questions, permissions, grades } : null,
    errors,
    warnings,
    questionTitles: questions.map((q) => q.title).filter(Boolean),
    gradesLabel: grades.join(', ') || '-',
    status: 'idle',
  };
}

const errorMessage = (err: any) => {
  const data = err?.response?.data;
  return data?.message ?? data?.error ?? (typeof data === 'string' ? data : null) ?? err?.message ?? 'Erro desconhecido';
};

const Forms: React.FC<IProps> = () => {
  const [permissions, setPermissions] = useState<IHubPermission[]>([]);
  const [availableGrades, setAvailableGrades] = useState<string[] | null>(null);
  const [existingTitles, setExistingTitles] = useState<Set<string>>(new Set());
  const [chosenPermissions, setChosenPermissions] = useState<string[]>([]);

  const [fileName, setFileName] = useState('');
  const [rawItems, setRawItems] = useState<unknown[] | null>(null);
  const [items, setItems] = useState<ImportItem[]>([]);
  const [selected, setSelected] = useState<Set<number>>(new Set());
  const [isSending, setIsSending] = useState(false);

  const fileRef = useRef<HTMLInputElement>(null);
  const toast = useToast();

  useEffect(() => {
    (async () => {
      const [perms, grades, forms] = await Promise.allSettled([listPermissions(), getAvailableGrades(), listForms()]);
      if (perms.status === 'fulfilled') setPermissions(perms.value.results ?? []);
      else toast({ status: 'error', description: 'Não foi possível carregar as permissões' });
      if (grades.status === 'fulfilled') setAvailableGrades(sortGrades(grades.value));
      // Duplicate detection is best effort: if the list route fails, just skip the warning.
      if (forms.status === 'fulfilled') setExistingTitles(new Set((forms.value.results ?? []).map((f) => norm(f.title ?? ''))));
    })();
  }, []);

  // Re-validate whenever the file, the grades/titles lookups or the chosen permissions change.
  useEffect(() => {
    if (!rawItems) return;
    const built = rawItems.map((raw, i) => buildItem(raw, i, availableGrades, existingTitles, chosenPermissions));
    setItems((prev) => built.map((b) => ({ ...b, status: prev[b.index]?.status ?? 'idle', sendError: prev[b.index]?.sendError })));
  }, [rawItems, availableGrades, existingTitles, chosenPermissions]);

  // Default selection: every valid item that has not been created yet.
  useEffect(() => {
    setSelected((prev) => {
      const next = new Set<number>();
      items.forEach((it) => {
        if (it.errors.length === 0 && it.status !== 'done') next.add(it.index);
      });
      // Keep the user's manual un-checks for items that were already in the previous selection state.
      return prev.size === 0 ? next : new Set([...next].filter((i) => prev.has(i)));
    });
  }, [rawItems, items.length]);

  const handleFile = async (e: ChangeEvent<HTMLInputElement>) => {
    const file = e.target.files?.[0];
    e.target.value = '';
    if (!file) return;
    try {
      const parsed = JSON.parse(await file.text());
      const list = Array.isArray(parsed) ? parsed : [parsed];
      if (list.length === 0) throw new Error('O arquivo está vazio.');
      setItems([]);
      setSelected(new Set());
      setFileName(file.name);
      setRawItems(list);
    } catch (err: any) {
      setRawItems(null);
      setItems([]);
      setFileName('');
      toast({ status: 'error', title: 'Arquivo inválido', description: `Não foi possível ler o JSON: ${err?.message ?? err}` });
    }
  };

  const toggle = (index: number) =>
    setSelected((s) => {
      const next = new Set(s);
      if (next.has(index)) next.delete(index);
      else next.add(index);
      return next;
    });

  const sendable = items.filter((it) => selected.has(it.index) && it.payload && it.status !== 'done');

  const patchItem = (index: number, patch: Partial<ImportItem>) =>
    setItems((s) => s.map((it) => (it.index === index ? { ...it, ...patch } : it)));

  const handleImport = async () => {
    if (isSending || sendable.length === 0) return;
    setIsSending(true);
    let ok = 0;
    let failed = 0;
    // One at a time on purpose: easier to read the failures and gentler on the backend.
    for (const it of sendable) {
      patchItem(it.index, { status: 'sending', sendError: undefined });
      try {
        await createForm(it.payload as IRegisterHubFormParams);
        patchItem(it.index, { status: 'done' });
        setSelected((s) => {
          const next = new Set(s);
          next.delete(it.index);
          return next;
        });
        ok++;
      } catch (err) {
        patchItem(it.index, { status: 'error', sendError: errorMessage(err) });
        failed++;
      }
    }
    setIsSending(false);
    toast({
      status: failed ? 'warning' : 'success',
      title: failed ? `${ok} criada(s), ${failed} com erro` : `${ok} avaliação(ões) criada(s)!`,
      description: failed ? 'Corrija e clique em importar de novo: só as que falharam serão reenviadas.' : undefined,
    });
  };

  const validCount = items.filter((i) => i.errors.length === 0).length;
  const doneCount = items.filter((i) => i.status === 'done').length;
  const permissionOptions = permissions.map((p) => ({ value: p.id, label: p.title }));

  return (
    <div className="font-sans">
      <PageHeader
        title="Avaliações"
        description="Importe várias avaliações por série de uma vez, a partir de um arquivo JSON."
      />

      <div className="rounded-xl border border-border bg-card p-5 space-y-5">
        <Field
          label="Permissões das avaliações"
          hint="Aplicadas a todas as avaliações importadas. Uma rede com restrição de conteúdo só vê avaliações que tenham uma permissão em comum com ela. Se deixar vazio, valem as permissões do próprio arquivo (se houver)."
        >
          <MultiSelect
            options={permissionOptions}
            value={chosenPermissions}
            onChange={setChosenPermissions}
            placeholder="Nenhuma permissão (avaliação sem restrição)"
          />
        </Field>

        <div>
          <input ref={fileRef} type="file" accept=".json,application/json" className="hidden" onChange={handleFile} />
          <button
            type="button"
            onClick={() => fileRef.current?.click()}
            disabled={isSending}
            className="inline-flex items-center gap-2 px-4 py-2 text-sm font-medium rounded-lg border border-dashed border-border bg-background hover:bg-muted disabled:opacity-50 transition"
          >
            <Upload className="size-4" /> {fileName ? 'Trocar arquivo' : 'Escolher arquivo JSON'}
          </button>
          {fileName && (
            <span className="ml-3 inline-flex items-center gap-1.5 text-sm text-muted-foreground">
              <FileJson className="size-4" /> {fileName}
            </span>
          )}
        </div>
      </div>

      {items.length > 0 && (
        <div className="mt-6 space-y-3">
          <div className="flex flex-wrap items-center justify-between gap-3">
            <p className="text-sm text-muted-foreground">
              {items.length} no arquivo · {validCount} válida(s) · {doneCount} criada(s) · {sendable.length} selecionada(s) para enviar
            </p>
            <SubmitButton onClick={handleImport} disabled={isSending || sendable.length === 0} brandClass="bg-brand-formacoes">
              {isSending ? 'Importando...' : `Importar ${sendable.length} avaliaç${sendable.length === 1 ? 'ão' : 'ões'}`}
            </SubmitButton>
          </div>

          <div className="rounded-xl ring-1 ring-border overflow-hidden divide-y divide-border bg-card">
            {items.map((it) => {
              const blocked = it.errors.length > 0;
              return (
                <div key={it.index} className="px-4 py-3">
                  <div className="flex items-start gap-3">
                    <input
                      type="checkbox"
                      className="mt-1 size-4 accent-[var(--color-brand-formacoes)]"
                      checked={selected.has(it.index)}
                      disabled={blocked || it.status === 'done' || isSending}
                      onChange={() => toggle(it.index)}
                      aria-label={`Selecionar ${it.title}`}
                    />
                    <div className="min-w-0 flex-1">
                      <div className="flex flex-wrap items-center gap-x-3 gap-y-1">
                        <span className="font-medium text-foreground">{it.title}</span>
                        <span className="text-xs text-muted-foreground">Série: {it.gradesLabel}</span>
                        <span className="text-xs text-muted-foreground">{it.questionTitles.length} pergunta(s)</span>
                      </div>

                      {it.errors.map((e, i) => (
                        <p key={`e${i}`} className="mt-1 flex items-start gap-1.5 text-xs text-destructive">
                          <XCircle className="size-3.5 mt-0.5 shrink-0" /> {e}
                        </p>
                      ))}
                      {it.warnings.map((w, i) => (
                        <p key={`w${i}`} className="mt-1 flex items-start gap-1.5 text-xs text-amber-600">
                          <AlertTriangle className="size-3.5 mt-0.5 shrink-0" /> {w}
                        </p>
                      ))}
                      {it.sendError && (
                        <p className="mt-1 flex items-start gap-1.5 text-xs text-destructive">
                          <XCircle className="size-3.5 mt-0.5 shrink-0" /> Falhou ao enviar: {it.sendError}
                        </p>
                      )}

                      {it.questionTitles.length > 0 && (
                        <details className="mt-1.5">
                          <summary className="cursor-pointer text-xs text-brand-formacoes select-none">Ver perguntas</summary>
                          <ol className="mt-1 list-decimal pl-5 text-xs text-muted-foreground space-y-0.5">
                            {it.questionTitles.map((t, i) => (
                              <li key={i}>{t}</li>
                            ))}
                          </ol>
                        </details>
                      )}
                    </div>
                    <div className="shrink-0 pt-0.5" aria-live="polite">
                      {it.status === 'sending' && <Loader2 className="size-4 animate-spin text-muted-foreground" />}
                      {it.status === 'done' && <CheckCircle2 className="size-4 text-emerald-600" />}
                      {it.status === 'error' && <XCircle className="size-4 text-destructive" />}
                      {it.status === 'idle' && (blocked ? <XCircle className="size-4 text-destructive/60" /> : <Circle className="size-4 text-muted-foreground/40" />)}
                    </div>
                  </div>
                </div>
              );
            })}
          </div>
          <p className="text-[11px] text-muted-foreground">
            Não há desfazer em lote: as avaliações já criadas ficam no sistema, mesmo se alguma falhar. Se importar o mesmo arquivo de novo, elas
            serão criadas outra vez.
          </p>
        </div>
      )}
    </div>
  );
};

export default Forms;

export const getServerSideProps: GetServerSideProps = async ({ req, res }) => {
  const selectedPage = 'forms';
  try {
    cookieManager.updateToken(req);
    const admin = await getProfile();
    return { props: { admin, selectedPage, pageTitle: 'Avaliações' } };
  } catch (err: any) {
    cookieManager.forceTokenExpires(res);
    logError(selectedPage, err);
    return { redirect: { destination: '/login', permanent: false } };
  }
};
