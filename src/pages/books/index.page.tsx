import { GetServerSideProps } from 'next';
import { useEffect, useState } from 'react';
import { useToast } from '@chakra-ui/react';
import { BookOpen, Copy, ExternalLink, Plus, Search, Trash2 } from 'lucide-react';

import { cookieManager, formatClassGrade, formatReadableId, logError, scopeLabelMapper, sortGrades } from '@/_base/utils';
import { useAsyncCallback, useInputHandler } from '@/_base/hooks';
import { getProfile } from '@/_base/services/user';
import { createBook, duplicateBook, listBooks, removeBook, updateBook } from '@/_base/services/book';
import { createBookCategory, listBookCategories, removeBookCategory, updateBookCategory } from '@/_base/services/bookCategory';
import { getPresignedUrl, uploadFile } from '@/_base/services/upload';
import { getAvailableGrades } from '@/_base/services/admin';
import { listPermissions } from '@/_base/services/permissions';
import { IHubBook, IUpdateHubBookParams, EMPTY_BOOK_SCHEMA_DATA, hubBookSchema } from '@/_base/interfaces/book';
import { IHubBookCategory, EMPTY_BOOK_CATEGORY_SCHEMA_DATA, hubBookCategorySchema } from '@/_base/interfaces/bookCategory';
import { IHubPermission } from '@/_base/interfaces/permission';
import { HubContentScope } from '@/_base/interfaces/shared';
import { IHubUser } from '@/_base/interfaces/user';
import { PageHeader } from '@/components/dashboard/PageHeader';
import { DataTable, ActionButton, PrimaryButton, type Column } from '@/components/dashboard/DataTable';
import { Modal } from '@/components/ui/modal';
import { ConfirmDialog } from '@/components/ui/confirm-dialog';
import { Field, TextField, SelectField, MultiSelect, FileField, RadioGroup } from '@/components/ui/form-controls';
import { CancelButton, SubmitButton, GhostButton } from '@/components/ui/form-buttons';
import { Tabs } from '@/components/ui/tabs';

interface IProps {
  user: IHubUser;
}

const SCOPE_OPTIONS = [
  { value: 'teacher', label: 'Professor' },
  { value: 'student', label: 'Aluno' },
  { value: '', label: 'Formação' },
];

async function uploadAndGetPath(file: File): Promise<string> {
  const { link, path } = await getPresignedUrl(file.type, 'books');
  await uploadFile(link, file);
  return path;
}

type BookRow = {
  id: string;
  code: string;
  title: string;
  category_name: string;
  grades_display: string;
};

const formatBookRow = (book: IHubBook): BookRow => ({
  id: book.id,
  code: formatReadableId(book.readable_id),
  title: book.title,
  category_name: book.category?.display_name || '-',
  grades_display: book.grades?.map(formatClassGrade).join(' · ') || '-',
});

type CategoryRow = {
  id: string;
  name: string;
  scope_label: string;
};

const formatCategoryRow = (category: IHubBookCategory): CategoryRow => ({
  id: category.id,
  name: category.display_name,
  scope_label: category.scope ? scopeLabelMapper[category.scope] : 'Formação',
});

const Books: React.FC<IProps> = () => {
  const [tab, setTab] = useState<'livros' | 'categorias'>('livros');
  const [isLoading, setIsLoading] = useState(false);

  const [books, setBooks] = useState<IHubBook[]>([]);
  const [categories, setCategories] = useState<IHubBookCategory[]>([]);
  const [permissions, setPermissions] = useState<IHubPermission[]>([]);
  const [availableGrades, setAvailableGrades] = useState<string[]>([]);

  const [bookRows, setBookRows] = useState<BookRow[]>([]);
  const [categoryRows, setCategoryRows] = useState<CategoryRow[]>([]);

  const [bookSearch, setBookSearch] = useState('');
  const [categorySearch, setCategorySearch] = useState('');

  const toast = useToast();

  // ---- Books ----
  const [targetBook, setTargetBook] = useState<IHubBook | null>(null);
  const [newThumbnail, setNewThumbnail] = useState<File | null>(null);
  const [newFile, setNewFile] = useState<File | null>(null);
  const [createBookOpen, setCreateBookOpen] = useState(false);
  const [duplicateOpen, setDuplicateOpen] = useState(false);
  const [removeBookOpen, setRemoveBookOpen] = useState(false);

  const {
    data: bookData,
    errors: bookErrors,
    setErrors: setBookErrors,
    onInputChange: onBookInputChange,
    submit: submitBook,
    setData: setBookData,
  } = useInputHandler({ data: EMPTY_BOOK_SCHEMA_DATA, schema: hubBookSchema });

  // ---- Categories ----
  const [targetCategory, setTargetCategory] = useState<IHubBookCategory | null>(null);
  const [createCategoryOpen, setCreateCategoryOpen] = useState(false);
  const [removeCategoryOpen, setRemoveCategoryOpen] = useState(false);

  const {
    data: categoryData,
    errors: categoryErrors,
    setErrors: setCategoryErrors,
    onInputChange: onCategoryInputChange,
    submit: submitCategory,
    setData: setCategoryData,
  } = useInputHandler({ data: EMPTY_BOOK_CATEGORY_SCHEMA_DATA, schema: hubBookCategorySchema });

  useEffect(() => {
    (async () => {
      setIsLoading(true);
      try {
        const [{ results: bookRes }, { results: categoryRes }, grades, { results: permissionRes }] = await Promise.all([
          listBooks(),
          listBookCategories(),
          getAvailableGrades(),
          listPermissions(),
        ]);
        setBooks(bookRes);
        setCategories(categoryRes);
        setPermissions(permissionRes);
        setAvailableGrades(sortGrades(grades));
      } catch {
        toast({ status: `error`, description: `Ocorreu um erro` });
      } finally {
        setIsLoading(false);
      }
    })();
  }, []);

  useEffect(() => setBookRows(books.map(formatBookRow)), [books]);
  useEffect(() => setCategoryRows(categories.map(formatCategoryRow)), [categories]);

  const resetBookCreateForm = () => {
    setBookData(EMPTY_BOOK_SCHEMA_DATA);
    setBookErrors({} as any);
    setNewThumbnail(null);
    setNewFile(null);
  };

  const resetCategoryCreateForm = () => {
    setCategoryData(EMPTY_BOOK_CATEGORY_SCHEMA_DATA);
    setCategoryErrors({} as any);
  };

  const handleOpenBookModal = (id: string) => {
    const book = books.find((e) => e.id === id);
    if (book) {
      setTargetBook(book);
      setNewThumbnail(null);
      setNewFile(null);
    }
  };

  const handleUpdateBook = useAsyncCallback(
    async () => {
      if (!targetBook) return;
      setIsLoading(true);

      const dto: IUpdateHubBookParams = {
        id: targetBook.id,
        title: targetBook.title,
        description: targetBook.description || undefined,
        permissions: targetBook.content_permission_links?.map((link) => link.permission.id),
      };
      if (newThumbnail) dto.thumbnail = await uploadAndGetPath(newThumbnail);
      if (newFile) dto.file = await uploadAndGetPath(newFile);

      const updatedBook = await updateBook(dto);

      setBooks((s) => s.map((e) => (e.id === updatedBook.id ? { ...targetBook, ...updatedBook } : e)));
      setTargetBook(null);
      setNewThumbnail(null);
      setNewFile(null);

      toast({ description: 'Livro atualizado!', status: 'success' });
    },
    [targetBook, newThumbnail, newFile],
    false,
    () => setIsLoading(false),
  );

  const handleRegisterBook = useAsyncCallback(
    async () => {
      setIsLoading(true);

      const payload = { ...bookData };
      if (newThumbnail) payload.thumbnail = await uploadAndGetPath(newThumbnail);
      if (newFile) payload.file = await uploadAndGetPath(newFile);

      const newBook = await createBook(payload);

      setBooks((s) => [newBook, ...s]);
      resetBookCreateForm();
      setCreateBookOpen(false);

      toast({ description: 'Livro criado!', status: 'success' });
    },
    [bookData, newThumbnail, newFile],
    false,
    () => setIsLoading(false),
  );

  const handleDuplicateBook = useAsyncCallback(
    async () => {
      if (!targetBook) return;
      setIsLoading(true);

      await duplicateBook(targetBook.id);
      const { results } = await listBooks();
      setBooks(results);

      setDuplicateOpen(false);
      setTargetBook(null);
      toast({ description: 'Livro duplicado!', status: 'success' });
    },
    [targetBook],
    false,
    () => setIsLoading(false),
  );

  const handleRemoveBook = useAsyncCallback(
    async () => {
      if (!targetBook) return;
      setIsLoading(true);

      await removeBook(targetBook.id);

      setBooks((s) => s.filter((e) => e.id !== targetBook.id));
      setTargetBook(null);
      setRemoveBookOpen(false);
      toast({ description: 'Livro removido!', status: 'success' });
    },
    [targetBook],
    false,
    () => setIsLoading(false),
  );

  const handleOpenCategoryModal = (id: string) => {
    const category = categories.find((e) => e.id === id);
    if (category) setTargetCategory(category);
  };

  const handleUpdateCategory = useAsyncCallback(
    async () => {
      if (!targetCategory) return;
      setIsLoading(true);

      const updatedCategory = await updateBookCategory({ id: targetCategory.id, display_name: targetCategory.display_name });

      setCategories((s) => s.map((e) => (e.id === updatedCategory.id ? { ...targetCategory, ...updatedCategory } : e)));
      setTargetCategory(null);

      toast({ description: 'Categoria atualizada!', status: 'success' });
    },
    [targetCategory],
    false,
    () => setIsLoading(false),
  );

  const handleRegisterCategory = useAsyncCallback(
    async () => {
      setIsLoading(true);

      const newCategory = await createBookCategory(categoryData);

      setCategories((s) => [newCategory, ...s]);
      resetCategoryCreateForm();
      setCreateCategoryOpen(false);

      toast({ description: 'Categoria criada!', status: 'success' });
    },
    [categoryData],
    false,
    () => setIsLoading(false),
  );

  const handleRemoveCategory = useAsyncCallback(
    async () => {
      if (!targetCategory) return;
      setIsLoading(true);

      await removeBookCategory(targetCategory.id);

      setCategories((s) => s.filter((e) => e.id !== targetCategory.id));
      setTargetCategory(null);
      setRemoveCategoryOpen(false);
      toast({ description: 'Categoria removida!', status: 'success' });
    },
    [targetCategory],
    false,
    () => setIsLoading(false),
  );

  const filteredBooks = bookRows.filter((row) => {
    if (!bookSearch.trim()) return true;
    const q = bookSearch.trim().toLowerCase();
    return row.code.toLowerCase().includes(q) || row.title?.toLowerCase().includes(q) || row.category_name?.toLowerCase().includes(q);
  });

  const filteredCategories = categoryRows.filter((row) => {
    if (!categorySearch.trim()) return true;
    const q = categorySearch.trim().toLowerCase();
    return row.name?.toLowerCase().includes(q) || row.scope_label?.toLowerCase().includes(q);
  });

  const permissionOptions = permissions.map((p) => ({ value: p.id, label: p.title }));
  const gradeOptions = availableGrades.map((g) => ({ value: g, label: formatClassGrade(g) }));
  const categoryOptions = categories.map((c) => ({ value: c.id, label: c.display_name }));

  const bookColumns: Column<BookRow>[] = [
    {
      key: 'titulo',
      header: 'Livro',
      render: (r) => (
        <div className="flex items-center gap-3">
          <div className="w-9 h-11 rounded bg-brand-livros/10 grid place-items-center shrink-0">
            <BookOpen className="size-4 text-brand-livros" />
          </div>
          <div className="flex flex-col">
            <span className="font-medium text-zinc-900">{r.title}</span>
            <span className="text-[11px] text-zinc-400">Código {r.code}</span>
          </div>
        </div>
      ),
    },
    { key: 'categoria', header: 'Categoria', render: (r) => <span className="text-zinc-600">{r.category_name}</span> },
    { key: 'anos', header: 'Anos', render: (r) => <span className="text-zinc-600">{r.grades_display}</span> },
    {
      key: 'acoes',
      header: 'Ações',
      className: 'text-right',
      render: (r) => (
        <div className="flex justify-end">
          <ActionButton tone="primary" onClick={() => handleOpenBookModal(r.id)}>
            Visualizar
          </ActionButton>
        </div>
      ),
    },
  ];

  const categoryColumns: Column<CategoryRow>[] = [
    { key: 'nome', header: 'Categoria', render: (r) => <span className="font-medium text-zinc-900">{r.name}</span> },
    { key: 'escopo', header: 'Escopo', render: (r) => <span className="text-zinc-600">{r.scope_label}</span> },
    {
      key: 'acoes',
      header: 'Ações',
      className: 'text-right',
      render: (r) => (
        <div className="flex justify-end">
          <ActionButton tone="primary" onClick={() => handleOpenCategoryModal(r.id)}>
            Visualizar
          </ActionButton>
        </div>
      ),
    },
  ];

  return (
    <div className="font-sans">
      <PageHeader
        title="Livros"
        description="Adicione e organize o acervo digital vinculado a atividades."
        actions={
          tab === 'livros' ? (
            <PrimaryButton onClick={() => setCreateBookOpen(true)}>
              <Plus className="size-4" /> Novo Livro
            </PrimaryButton>
          ) : (
            <PrimaryButton onClick={() => setCreateCategoryOpen(true)}>
              <Plus className="size-4" /> Nova Categoria
            </PrimaryButton>
          )
        }
      />

      <Tabs
        items={[
          { value: 'livros', label: 'Livros' },
          { value: 'categorias', label: 'Categoria de livros' },
        ]}
        value={tab}
        onChange={(v) => setTab(v as 'livros' | 'categorias')}
      />

      {tab === 'livros' ? (
        <>
          <div className="mb-4 max-w-xs relative">
            <Search className="size-4 text-zinc-400 absolute left-3 top-1/2 -translate-y-1/2" />
            <input
              value={bookSearch}
              onChange={(e) => setBookSearch(e.target.value)}
              placeholder="Buscar por código, título ou categoria"
              className="w-full pl-9 pr-3 py-2 text-sm rounded-lg border border-input bg-background text-foreground focus:outline-none focus:ring-2 focus:ring-brand-livros/30 focus:border-brand-livros transition"
            />
          </div>
          <DataTable columns={bookColumns} data={filteredBooks} empty={isLoading ? 'Carregando...' : 'Nenhum livro cadastrado.'} />
        </>
      ) : (
        <>
          <div className="mb-4 max-w-xs relative">
            <Search className="size-4 text-zinc-400 absolute left-3 top-1/2 -translate-y-1/2" />
            <input
              value={categorySearch}
              onChange={(e) => setCategorySearch(e.target.value)}
              placeholder="Buscar por nome ou escopo"
              className="w-full pl-9 pr-3 py-2 text-sm rounded-lg border border-input bg-background text-foreground focus:outline-none focus:ring-2 focus:ring-brand-livros/30 focus:border-brand-livros transition"
            />
          </div>
          <DataTable
            columns={categoryColumns}
            data={filteredCategories}
            empty={isLoading ? 'Carregando...' : 'Nenhuma categoria cadastrada.'}
          />
        </>
      )}

      {/* Book view / edit modal */}
      <Modal
        open={!!targetBook}
        onClose={() => setTargetBook(null)}
        title={targetBook?.title ?? 'Livro'}
        width="max-w-2xl"
        footer={
          <>
            <CancelButton onClick={() => setTargetBook(null)} />
            <SubmitButton onClick={handleUpdateBook} disabled={!targetBook?.title?.trim()} brandClass="bg-brand-livros">
              Salvar
            </SubmitButton>
          </>
        }
      >
        {targetBook && (
          <div className="space-y-5">
            <div className="grid sm:grid-cols-2 gap-4">
              <Field label="Categoria">
                <TextField value={targetBook.category?.display_name ?? ''} readOnly />
              </Field>
              <Field label="Anos">
                <TextField value={targetBook.grades?.map(formatClassGrade).join(', ') || '-'} readOnly />
              </Field>
            </div>
            <Field label="Nome" required>
              <TextField value={targetBook.title} onChange={(v) => setTargetBook((e) => (e ? { ...e, title: v } : e))} />
            </Field>
            <Field label="Descrição">
              <TextField
                value={targetBook.description ?? ''}
                onChange={(v) => setTargetBook((e) => (e ? { ...e, description: v } : e))}
                placeholder="Descrição opcional"
              />
            </Field>
            <Field label="Permissões">
              <MultiSelect
                options={permissionOptions}
                value={targetBook.content_permission_links?.map((l) => l.permission.id) ?? []}
                onChange={(ids) =>
                  setTargetBook((e) =>
                    e ? { ...e, content_permission_links: ids.map((id) => ({ id, permission: permissions.find((p) => p.id === id) }) as any) } : e,
                  )
                }
                placeholder="Selecione as permissões"
                brandClass="text-brand-livros"
                brandBgClass="bg-brand-livros/10"
                ringClass="focus:ring-brand-livros/30 focus:border-brand-livros"
              />
            </Field>

            <div className="grid sm:grid-cols-2 gap-4">
              <Field label="Capa">
                <div className="space-y-2">
                  {targetBook.thumbnail && (
                    <img src={targetBook.thumbnail} alt="Capa atual" className="h-28 rounded-lg ring-1 ring-border object-cover" />
                  )}
                  <FileField
                    accept="image/*"
                    fileName={newThumbnail?.name}
                    onChange={setNewThumbnail}
                    brandClass="text-brand-livros"
                  />
                </div>
              </Field>
              <Field label="Arquivo do livro">
                <div className="space-y-2">
                  {targetBook.file && (
                    <a
                      href={targetBook.file}
                      target="_blank"
                      rel="noreferrer"
                      className="inline-flex items-center gap-1.5 text-sm text-brand-livros hover:underline"
                    >
                      <ExternalLink className="size-3.5" /> Ver arquivo atual
                    </a>
                  )}
                  <FileField fileName={newFile?.name} onChange={setNewFile} brandClass="text-brand-livros" />
                </div>
              </Field>
            </div>

            <div className="flex flex-wrap gap-2 pt-2 border-t border-border">
              <GhostButton onClick={() => setDuplicateOpen(true)}>
                <Copy className="size-4" /> Duplicar livro
              </GhostButton>
              <GhostButton tone="danger" onClick={() => setRemoveBookOpen(true)}>
                <Trash2 className="size-4" /> Excluir livro
              </GhostButton>
            </div>
          </div>
        )}
      </Modal>

      <ConfirmDialog
        open={duplicateOpen}
        onClose={() => setDuplicateOpen(false)}
        onConfirm={handleDuplicateBook}
        title="Duplicar livro"
        description={`Duplicar "${targetBook?.title}"? Uma cópia será criada.`}
        confirmLabel="Duplicar"
        tone="neutral"
      />
      <ConfirmDialog
        open={removeBookOpen}
        onClose={() => setRemoveBookOpen(false)}
        onConfirm={handleRemoveBook}
        title={`Remover ${targetBook?.title ?? 'livro'}`}
        description="Tem certeza disso? Essa ação é irreversível."
        confirmLabel="Remover"
        tone="danger"
      />

      {/* Book create modal */}
      <Modal
        open={createBookOpen}
        onClose={() => {
          resetBookCreateForm();
          setCreateBookOpen(false);
        }}
        title="Registrar livro"
        width="max-w-2xl"
        footer={
          <>
            <CancelButton
              onClick={() => {
                resetBookCreateForm();
                setCreateBookOpen(false);
              }}
            />
            <SubmitButton
              onClick={() => submitBook(handleRegisterBook)}
              disabled={!bookData.title?.trim() || !bookData.category_id || !bookData.grades?.length}
              brandClass="bg-brand-livros"
            >
              Registrar
            </SubmitButton>
          </>
        }
      >
        <div className="space-y-5">
          <div className="grid sm:grid-cols-2 gap-4">
            <Field label="Categoria" required error={bookErrors.category_id}>
              <SelectField
                value={bookData.category_id ?? ''}
                onChange={(v) => onBookInputChange('category_id', v)}
                options={categoryOptions}
                placeholder="Selecione a categoria"
                error={bookErrors.category_id}
              />
            </Field>
            <Field label="Anos" required error={bookErrors.grades as any}>
              <MultiSelect
                options={gradeOptions}
                value={bookData.grades ?? []}
                onChange={(v) => onBookInputChange('grades', v)}
                placeholder="Selecione os anos"
                brandClass="text-brand-livros"
                brandBgClass="bg-brand-livros/10"
                ringClass="focus:ring-brand-livros/30 focus:border-brand-livros"
              />
            </Field>
          </div>
          <Field label="Nome" required error={bookErrors.title}>
            <TextField
              value={bookData.title ?? ''}
              onChange={(v) => onBookInputChange('title', v)}
              placeholder="Ex: Robótica Avançada"
              error={bookErrors.title}
            />
          </Field>
          <Field label="Descrição" error={bookErrors.description}>
            <TextField
              value={bookData.description ?? ''}
              onChange={(v) => onBookInputChange('description', v)}
              placeholder="Descrição opcional"
              error={bookErrors.description}
            />
          </Field>
          <Field label="Permissões">
            <MultiSelect
              options={permissionOptions}
              value={bookData.permissions ?? []}
              onChange={(v) => onBookInputChange('permissions', v)}
              placeholder="Selecione as permissões"
              brandClass="text-brand-livros"
              brandBgClass="bg-brand-livros/10"
              ringClass="focus:ring-brand-livros/30 focus:border-brand-livros"
            />
          </Field>
          <div className="grid sm:grid-cols-2 gap-4">
            <Field label="Capa">
              <FileField accept="image/*" fileName={newThumbnail?.name} onChange={setNewThumbnail} brandClass="text-brand-livros" />
            </Field>
            <Field label="Arquivo do livro">
              <FileField fileName={newFile?.name} onChange={setNewFile} brandClass="text-brand-livros" />
            </Field>
          </div>
        </div>
      </Modal>

      {/* Category view / edit modal */}
      <Modal
        open={!!targetCategory}
        onClose={() => setTargetCategory(null)}
        title={targetCategory?.display_name ?? 'Categoria'}
        footer={
          <>
            <CancelButton onClick={() => setTargetCategory(null)} />
            <SubmitButton onClick={handleUpdateCategory} disabled={!targetCategory?.display_name?.trim()} brandClass="bg-brand-livros">
              Salvar
            </SubmitButton>
          </>
        }
      >
        {targetCategory && (
          <div className="space-y-5">
            <Field label="Escopo da categoria">
              <TextField value={targetCategory.scope ? scopeLabelMapper[targetCategory.scope] : 'Formação'} readOnly />
            </Field>
            <Field label="Nome" required>
              <TextField
                value={targetCategory.display_name}
                onChange={(v) => setTargetCategory((e) => (e ? { ...e, display_name: v } : e))}
              />
            </Field>
            <div className="pt-2 border-t border-border">
              <GhostButton tone="danger" onClick={() => setRemoveCategoryOpen(true)}>
                <Trash2 className="size-4" /> Excluir categoria
              </GhostButton>
            </div>
          </div>
        )}
      </Modal>

      <ConfirmDialog
        open={removeCategoryOpen}
        onClose={() => setRemoveCategoryOpen(false)}
        onConfirm={handleRemoveCategory}
        title={`Remover ${targetCategory?.display_name ?? 'categoria'}`}
        description="Tem certeza disso? Essa ação é irreversível."
        confirmLabel="Remover"
        tone="danger"
      />

      {/* Category create modal */}
      <Modal
        open={createCategoryOpen}
        onClose={() => {
          resetCategoryCreateForm();
          setCreateCategoryOpen(false);
        }}
        title="Registrar categoria"
        footer={
          <>
            <CancelButton
              onClick={() => {
                resetCategoryCreateForm();
                setCreateCategoryOpen(false);
              }}
            />
            <SubmitButton
              onClick={() => submitCategory(handleRegisterCategory)}
              disabled={!categoryData.display_name?.trim()}
              brandClass="bg-brand-livros"
            >
              Registrar
            </SubmitButton>
          </>
        }
      >
        <div className="space-y-5">
          <Field label="Escopo da categoria" error={categoryErrors.scope}>
            <RadioGroup
              value={(categoryData.scope as HubContentScope | '') ?? ''}
              onChange={(v) => onCategoryInputChange('scope', (v || null) as any)}
              options={SCOPE_OPTIONS}
              brandClass="text-brand-livros border-brand-livros"
            />
          </Field>
          <Field label="Nome" required error={categoryErrors.display_name}>
            <TextField
              value={categoryData.display_name ?? ''}
              onChange={(v) => onCategoryInputChange('display_name', v)}
              placeholder="Ex: Robótica"
              error={categoryErrors.display_name}
            />
          </Field>
        </div>
      </Modal>
    </div>
  );
};

export default Books;

export const getServerSideProps: GetServerSideProps = async ({ req, res }) => {
  const selectedPage = 'books';
  try {
    cookieManager.updateToken(req);
    const admin = await getProfile();
    return { props: { admin, selectedPage, pageTitle: 'Livros' } };
  } catch (err: any) {
    cookieManager.forceTokenExpires(res);
    logError(selectedPage, err);
    return { redirect: { destination: '/login', permanent: false } };
  }
};
