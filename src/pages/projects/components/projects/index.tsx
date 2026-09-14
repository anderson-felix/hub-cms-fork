import React, { useCallback, useEffect, useRef, useState } from 'react';
import { Space, Table, Input, Button, InputRef, Modal } from 'antd';
import { SearchOutlined } from '@ant-design/icons';
import { motion } from 'framer-motion';
import { FaPlus, FaTrash } from 'react-icons/fa6';
import type { ColumnType, ColumnsType } from 'antd/es/table';
import {
  Accordion,
  AccordionButton,
  AccordionIcon,
  AccordionItem,
  AccordionPanel,
  AlertDialog,
  AlertDialogBody,
  AlertDialogContent,
  AlertDialogFooter,
  AlertDialogHeader,
  AlertDialogOverlay,
  Flex,
  Image,
  Text,
  useDisclosure,
  useToast,
} from '@chakra-ui/react';

import { FilterConfirmProps } from 'antd/es/table/interface';
import Highlighter from 'react-highlight-words';
import { ModalContent, ShowAction } from './styles';
import { formatClassGrade, formatReadableId } from '@/_base/utils';
import { useInputHandler } from '@/_base/hooks';
import { GenericButton } from '@/components/Buttons/Generic';
import { TextInput } from '@/components/Inputs/Text';
import { SelectInput } from '@/components/Inputs/Select';
import { IHubPermission } from '@/_base/interfaces/permission';
import { FaEdit } from 'react-icons/fa';
import {
  EMPTY_PROJECT_DATA,
  hubProjectSchema,
  IRegisterProjectParams,
  IHubProject,
  IUpdateProjectParams,
  IHubProjectStep,
} from '@/_base/interfaces/project';
import moment from 'moment';
import { IHubBook } from '@/_base/interfaces/book';
import { IHubVideo } from '@/_base/interfaces/video';
import { TextAreaInput } from '@/components/Inputs/TextArea';
import { IBnccSkill } from '@/_base/interfaces/shared';
import { ColorPicker } from '@/components/Inputs/ColorPicker';
import { UploadInput, useBaseUploadInput } from '@/components/Inputs/Upload/Base';

interface DataType {
  key: string;
  readable_id: string;
  title: string;
  grades: string;
  created_at: string;
}
type DataIndex = keyof DataType;

interface IProps {
  dataSource: IHubProject[];
  permissions: IHubPermission[];
  books: IHubBook[];
  videos: IHubVideo[];
  bnccSkills: IBnccSkill[];
  availableGrades: string[];
  openRegisterModal: boolean;
  isLoading: boolean;
  setOpenRegisterModal: React.Dispatch<React.SetStateAction<boolean>>;
  fetchData: () => Promise<void>;
  handleUpdate: (data: IUpdateProjectParams, thumb?: File | null) => void;
  handleCreate: (data: IRegisterProjectParams, thumb?: File | null) => void;
  handleRemove: (data: IHubProject) => void;
}

export const ProjectsTable: React.FC<IProps> = ({
  dataSource,
  availableGrades,
  permissions,
  handleCreate,
  handleRemove,
  handleUpdate,
  openRegisterModal,
  setOpenRegisterModal,
  isLoading: pageIsLoading,
  books,
  bnccSkills,
}) => {
  const [targetProject, setTargetProject] = useState<IHubProject | null>(null);
  const [tableData, setTableData] = useState<DataType[]>([]);
  const [searchText, setSearchText] = useState('');
  const [searchedColumn, setSearchedColumn] = useState('');
  const [projects, setProjects] = useState<IHubProject[]>(dataSource);
  const [activityParents, setActivityParents] = useState<string[]>([]);
  const [activityColorsByStep, setActivityColorsByStep] = useState<Record<string, string>>({});
  const [activityParentError, setActivityStepError] = useState(``);
  const [thumbToUpload, setThumbToUpload] = useState<File | null>(null);

  const searchInput = useRef<InputRef>(null);
  const cancelRef = useRef(null);
  const { isOpen, onOpen, onClose } = useDisclosure();
  const toast = useToast();
  const { data, errors, setErrors, onInputChange, submit, setData } = useInputHandler<IRegisterProjectParams>({
    data: EMPTY_PROJECT_DATA,
    schema: hubProjectSchema,
  });
  const { clearFileList: clearImages } = useBaseUploadInput();

  useEffect(() => {
    setTableData(projects.map(formatTableData));
  }, [projects]);

  useEffect(() => {
    setProjects(dataSource);
  }, [dataSource]);

  const handleSearch = (selectedKeys: string[], confirm: (param?: FilterConfirmProps) => void, dataIndex: DataIndex) => {
    confirm();
    setSearchText(selectedKeys[0]);
    setSearchedColumn(dataIndex);
  };

  const onCloseModal = () => {
    setTargetProject(null);
    clearImages();
    setThumbToUpload(null);
    setData(EMPTY_PROJECT_DATA);
    setActivityParents([]);
    setActivityStepError(``);
    setOpenRegisterModal(false);
  };

  const handleReset = (clearFilters: () => void) => {
    clearFilters();
    setSearchText('');
    setSearchedColumn(``);
    setProjects((e) => e);
  };

  const getColumnSearchProps = (dataIndex: DataIndex): ColumnType<DataType> => ({
    filterDropdown: ({ setSelectedKeys, selectedKeys, confirm, clearFilters, close }) => (
      <div style={{ padding: 8 }} onKeyDown={(e) => e.stopPropagation()}>
        <Input
          ref={searchInput}
          placeholder={`Search ${dataIndex}`}
          value={selectedKeys[0]}
          onChange={(e) => setSelectedKeys(e.target.value ? [e.target.value] : [])}
          onPressEnter={() => handleSearch(selectedKeys as string[], confirm, dataIndex)}
          style={{ marginBottom: 8, display: 'block' }}
        />
        <Space>
          <Button
            type="primary"
            onClick={() => handleSearch(selectedKeys as string[], confirm, dataIndex)}
            icon={<SearchOutlined />}
            size="small"
            style={{ width: 90 }}
          >
            Search
          </Button>
          <Button onClick={() => clearFilters && handleReset(clearFilters)} size="small" style={{ width: 90 }}>
            Reset
          </Button>
          <Button
            type="link"
            size="small"
            onClick={() => {
              confirm({ closeDropdown: false });
              setSearchText((selectedKeys as string[])[0]);
              setSearchedColumn(dataIndex);
            }}
          >
            Filter
          </Button>
          <Button
            type="link"
            size="small"
            onClick={() => {
              close();
            }}
          >
            close
          </Button>
        </Space>
      </div>
    ),
    filterIcon: (filtered: boolean) => <SearchOutlined style={{ color: filtered ? '#1677ff' : undefined }} />,
    onFilter: (value, record) =>
      record[dataIndex]
        .toString()
        .toLowerCase()
        .includes((value as string).toLowerCase()),
    onFilterDropdownOpenChange: (visible) => {
      if (visible) {
        setTimeout(() => searchInput.current?.select(), 100);
      }
    },
    render: (text) =>
      searchedColumn === dataIndex ? (
        <Highlighter
          highlightStyle={{ backgroundColor: '#ffc069', padding: 0 }}
          searchWords={[searchText]}
          autoEscape
          textToHighlight={text ? text.toString() : ''}
        />
      ) : (
        text
      ),
  });

  const handleOpenProjectModal = (readable_id: string) => {
    const target = projects.find((e) => formatReadableId(e.readable_id) === readable_id);

    if (target) {
      const targetActivityParents =
        target?.metadata?.steps?.reduce((acc, r) => (acc.includes(r.parent) ? acc : [...acc, r.parent]), [] as string[]) || [];
      if (!targetActivityParents.filter((e) => e).length) target.metadata.steps = [];
      setActivityParents(targetActivityParents);
      setActivityColorsByStep(
        target.metadata.steps?.reduce(
          (acc, v) => {
            acc[v.parent] = v.color;
            return acc;
          },
          {} as Record<string, string>,
        ) || {},
      );
      setTargetProject(target);
    }
  };

  const handleUpdateProject = useCallback(() => {
    if (!targetProject) return;

    targetProject.metadata.steps?.forEach((e) => {
      e.color = activityColorsByStep[e.parent];
    });

    const dto: IUpdateProjectParams = {
      id: targetProject.id,
      title: targetProject.title,
      metadata: targetProject.metadata,
      description: targetProject.description || undefined,
      permissions: targetProject.content_permission_links?.map((link) => link.permission.id),
    };

    handleUpdate(dto, thumbToUpload);

    setTargetProject(null);
    setActivityColorsByStep({});
    clearImages();
    setThumbToUpload(null);
    toast({ description: 'Projeto atualizado!', status: 'success' });
  }, [targetProject, thumbToUpload]);

  const handleRegisterProject = useCallback(() => {
    data.metadata.steps?.forEach((e) => {
      e.color = activityColorsByStep[e.parent];
    });
    handleCreate(data, thumbToUpload);

    setData(EMPTY_PROJECT_DATA);
    setErrors({} as any);
    clearImages();
    setThumbToUpload(null);
    setActivityColorsByStep({});
  }, [data]);

  const handleRemoveProject = useCallback(() => {
    if (!targetProject) return;

    handleRemove(targetProject);

    setProjects((s) => s.filter((e) => e.id !== targetProject.id));
    setTargetProject(null);
    onClose();
  }, [targetProject]);

  const handleChangeMetadata = (currData: IRegisterProjectParams | IHubProject, obj: Partial<IHubProjectStep>, index: number) => {
    if (currData.metadata?.steps && currData.metadata.steps[index]) {
      const steps = [...currData.metadata.steps];
      steps[index] = { ...currData.metadata?.steps[index], ...obj };
      if ((currData as any).id) setTargetProject((c) => ({ ...(c || ({} as any)), metadata: { ...(c?.metadata || {}), steps } }));
      else onInputChange(`metadata`, { ...currData.metadata, steps });
    }
  };

  const handleRemoveMetadataItem = (currData: IRegisterProjectParams | IHubProject, index: number) => {
    if (currData.metadata?.steps && currData.metadata.steps[index]) {
      const steps = [...currData.metadata.steps];
      delete steps[index];

      const newData = { ...currData.metadata, steps: steps.filter((e) => e) };

      if ((currData as any).id) setTargetProject((c) => ({ ...(c || ({} as any)), metadata: newData }));
      else onInputChange(`metadata`, newData);
    }
  };

  const handleAddNewStep = useCallback(() => {
    if (activityParents.length && !activityParents.find((e) => !!e)?.length) setActivityStepError(`Preencha o campo`);
    else setActivityParents((e) => [...e, ``]);
  }, [activityParents]);

  const columns: ColumnsType<DataType> = [
    {
      title: 'ID',
      dataIndex: 'readable_id',
      key: 'readable_id',
      ...getColumnSearchProps('readable_id'),
    },
    {
      title: 'Projeto',
      dataIndex: 'title',
      key: 'title',
      ...getColumnSearchProps('title'),
    },
    {
      title: 'Anos',
      dataIndex: 'grades',
      key: 'grades',
    },
    {
      title: 'Criado em',
      dataIndex: 'created_at',
      key: 'created_at',
    },
    {
      title: 'Editar',
      key: 'course',
      align: `center`,
      width: `80px`,
      render: (_, { readable_id }) => (
        <ShowAction onClick={() => handleOpenProjectModal(readable_id)}>
          <FaEdit />
        </ShowAction>
      ),
    },
  ];

  return (
    <>
      <Table loading={pageIsLoading} columns={columns} dataSource={tableData} size="middle" />

      <Modal
        open={!!targetProject}
        title={targetProject ? `${targetProject.title}` : ''}
        onOk={handleUpdateProject}
        width={'70%'}
        onCancel={onCloseModal}
        okText="Salvar"
        cancelText="Cancelar"
        confirmLoading={pageIsLoading}
        style={{ maxWidth: `1080px` }}
        centered
      >
        <ModalContent style={{ maxHeight: `calc(100vh - 200px)`, overflow: `auto` }}>
          <GenericButton
            size="xs"
            w="fit-content"
            alignSelf="flex-end"
            label="Excluir"
            btntype="outline-warning"
            rightIcon={<FaTrash />}
            onClick={onOpen}
          />
          <Flex gap="1rem" w="100%">
            <Flex direction="column" gap="1rem" flex="1" maxW="50%">
              <TextInput
                label="Título"
                p="0.15rem 0.5rem"
                error={errors.title}
                value={targetProject?.title}
                onInputChange={(title) => setTargetProject((c) => ({ ...(c || ({} as any)), title }))}
              />
              <TextAreaInput
                label="Objetivo"
                p="0.15rem 0.5rem"
                value={targetProject?.description || ``}
                onInputChange={(description) => setTargetProject((c) => ({ ...(c || ({} as any)), description }))}
                error={errors.description}
              />

              <SelectInput
                label="Anos"
                placeholder="Selecione os anos"
                error={errors.grades}
                mode="multiple"
                value={targetProject?.grades}
                disabled
                options={availableGrades.map((grade) => ({ label: grade, value: grade }))}
              />

              <SelectInput
                label="Habilidades BNCC"
                placeholder="Selecione as habilidades BNCC do projeto"
                mode="multiple"
                value={
                  targetProject?.metadata?.bncc?.map((tag) => ({
                    label: `${bnccSkills.find((e) => e.tag === tag)?.tag} - ${bnccSkills.find((e) => e.tag === tag)?.title}`,
                    value: tag,
                  })) || []
                }
                onChange={(bnccList) =>
                  setTargetProject((p) => ({
                    ...(p || ({} as any)),
                    metadata: { ...(p?.metadata || {}), bncc: bnccList },
                  }))
                }
                options={bnccSkills.map((e) => ({ label: `${e.tag} - ${e.title}`, value: e.tag }))}
              />

              <SelectInput
                label="Ferramentas"
                placeholder="Insira ou selecione as ferramentas necessárias para o projeto"
                mode="tags"
                value={targetProject?.metadata?.tools?.map((e) => ({ label: e, value: e })) || []}
                onChange={(tools) => setTargetProject((p) => ({ ...(p || ({} as any)), metadata: { ...(p?.metadata || {}), tools } }))}
                options={genericTools.map((e) => ({ label: e, value: e }))}
              />

              <SelectInput
                label="Permissões"
                placeholder="Selecione as permissões"
                mode="multiple"
                value={targetProject?.content_permission_links?.map((link) => ({ label: link?.permission?.title, value: link?.permission?.id })) || []}
                options={permissions.map((permission) => ({ label: permission?.title, value: permission?.id }))}
                onChange={(ids: string[]) =>
                  setTargetProject((_course) => ({
                    ...(_course || ({} as any)),
                    content_permission_links: ids.map((id) => ({ id, permission: permissions.find((p) => p.id === id) })),
                  }))
                }
              />

              <SelectInput
                label="Livro"
                placeholder="Selecione o livro do projeto"
                error={errors.book_id}
                value={targetProject?.book_id}
                disabled
                options={books.map((book) => ({ label: book.title, value: book.id }))}
              />

              <Flex justify="space-between" gap="1rem">
                <Flex>
                  <UploadInput label="Substituir thumbnail" accept="image/*" onChange={setThumbToUpload} />
                </Flex>
                {targetProject?.metadata?.thumbnail && (
                  <Image src={targetProject.metadata.thumbnail} style={{ maxHeight: `11rem`, borderRadius: `6px` }} />
                )}
              </Flex>
            </Flex>
            <Flex direction="column" gap="1rem" flex="1" maxW="50%">
              <Flex flex="1" direction="column" gap="0.5rem">
                <Flex justify="space-between">
                  <Text fontWeight="500" fontSize="18px">
                    Etapas do projeto
                  </Text>
                  <Button size="small" style={{ width: 'fit-content', alignSelf: `flex-end` }} onClick={handleAddNewStep}>
                    <Flex align="center" gap="0.5rem">
                      <Text>Adicionar etapa</Text>
                      <FaPlus />
                    </Flex>
                  </Button>
                </Flex>
                <Accordion allowMultiple w="100%" fontWeight="500" color="gray700" gap="1rem">
                  {activityParents.map((parent, idx) => (
                    <AccordionItem key={parent + idx} border="1px" borderColor="#ccccccdd" mb="1rem" borderRadius="md" p="0.5rem">
                      <AccordionButton justifyContent="space-between" p="0" gap="0.5rem">
                        <TextInput
                          key={idx + 2}
                          h="2rem"
                          label={`Etapa ${idx + 1}`}
                          size="xs"
                          placeholder="Ex: Planejamento"
                          value={parent}
                          error={parent ? undefined : activityParentError}
                          autoFocus
                          onInputChange={(value) =>
                            setActivityParents((arr) =>
                              arr.map((e, index) => {
                                if (idx === index) e = value;
                                return e;
                              }),
                            )
                          }
                        />
                        <ColorPicker
                          label="Cor"
                          disableEntry
                          disableColorLabel
                          colors={colors.map((e) => e.color)}
                          onChange={(color) =>
                            setActivityColorsByStep((e) => {
                              e[parent] = color;
                              return e;
                            })
                          }
                          color={activityColorsByStep[parent]}
                        />
                        <AccordionIcon />
                      </AccordionButton>
                      <AccordionPanel fontWeight="400" display="flex" justifyContent="flex-end" p="0" w="100%" mt="0.5rem">
                        <Button
                          size="small"
                          style={{ fontSize: `13px` }}
                          onClick={() =>
                            setTargetProject((e) => ({
                              ...(e || ({} as any)),
                              metadata: {
                                ...(e?.metadata || ({} as any)),
                                steps: [
                                  ...(e?.metadata?.steps || []),
                                  {
                                    title: ``,
                                    parent,
                                    description: ``,
                                    position: (e?.metadata?.steps?.length || 0) + 1,
                                    cashback: ``,
                                  },
                                ],
                              },
                            }))
                          }
                        >
                          <Flex align="center" gap="0.5rem">
                            <Text>{parent ? `Adicionar atividades em ${parent}` : `Adicionar atividades`}</Text>
                            <FaPlus />
                          </Flex>
                        </Button>
                      </AccordionPanel>

                      {(targetProject?.metadata?.steps || []).map((step, i) =>
                        step.parent !== parent ? null : (
                          <AccordionPanel fontWeight="400" key={i + 1}>
                            <Flex gap="1rem">
                              <Flex flex="3" align="center">
                                <TextInput
                                  label="Atividade"
                                  size="xs"
                                  p="0.25rem"
                                  h="1.4rem"
                                  value={step.title}
                                  onInputChange={(title) => targetProject && handleChangeMetadata(targetProject, { title }, i)}
                                />
                              </Flex>
                              <Flex flex="1">
                                <TextInput
                                  label="Cashback"
                                  size="xs"
                                  p="0.25rem"
                                  h="1.4rem"
                                  value={step.cashback}
                                  autoFocus
                                  onInputChange={(value) =>
                                    targetProject && handleChangeMetadata(targetProject, { cashback: value?.match(/\d+/g)?.join('') || `` }, i)
                                  }
                                />
                              </Flex>
                              <Flex align="flex-end" pb="0.6rem" color="#BA1B1Bdd" onClick={() => handleRemoveMetadataItem(data, i)}>
                                <motion.button whileHover={{ scale: 1.3 }} whileTap={{ scale: 0.9 }}>
                                  <FaTrash />
                                </motion.button>
                              </Flex>
                            </Flex>
                          </AccordionPanel>
                        ),
                      )}
                    </AccordionItem>
                  ))}
                </Accordion>
              </Flex>
            </Flex>
          </Flex>
        </ModalContent>
      </Modal>

      <Modal
        open={openRegisterModal}
        title={`Cadastrar projeto`}
        onOk={() => submit(handleRegisterProject)}
        onCancel={onCloseModal}
        okText="Cadastrar"
        width={'70%'}
        style={{ maxWidth: `1080px` }}
        cancelText="Cancelar"
        confirmLoading={pageIsLoading}
        centered
      >
        <ModalContent style={{ maxHeight: `calc(100vh - 200px)`, overflow: `auto` }}>
          <Flex gap="1rem" w="100%">
            <Flex direction="column" gap="1rem" flex="1" maxW="50%">
              <TextInput
                label="Título"
                p="0.15rem 0.5rem"
                value={data.title}
                onInputChange={(value) => onInputChange(`title`, value)}
                error={errors.title}
              />
              <TextAreaInput
                label="Objetivo"
                p="0.15rem 0.5rem"
                value={data.description || ``}
                onInputChange={(value) => onInputChange(`description`, value)}
                error={errors.description}
              />

              <SelectInput
                label="Anos"
                placeholder="Selecione os anos"
                mode="multiple"
                error={errors.grades}
                value={data.grades}
                onChange={(grades) => onInputChange(`grades`, grades)}
                options={availableGrades.map((grade) => ({ label: formatClassGrade(grade), value: grade }))}
              />

              <SelectInput
                label="Habilidades BNCC"
                placeholder="Selecione as habilidades BNCC do projeto"
                mode="multiple"
                value={
                  data?.metadata?.bncc?.map((tag) => ({
                    label: `${bnccSkills.find((e) => e.tag === tag)?.tag} - ${bnccSkills.find((e) => e.tag === tag)?.title}`,
                    value: tag,
                  })) || []
                }
                onChange={(bnccList) => onInputChange(`metadata`, { ...data.metadata, bncc: bnccList })}
                options={bnccSkills.map((e) => ({ label: `${e.tag} - ${e.title}`, value: e.tag }))}
              />

              <SelectInput
                label="Ferramentas"
                placeholder="Insira ou selecione as ferramentas necessárias para o projeto"
                mode="tags"
                value={data?.metadata?.tools?.map((e) => ({ label: e, value: e })) || []}
                onChange={(tools) => onInputChange(`metadata`, { ...data.metadata, tools })}
                options={genericTools.map((e) => ({ label: e, value: e }))}
              />
              <SelectInput
                label="Permissões"
                placeholder="Selecione as permissões"
                mode="multiple"
                value={
                  data.permissions?.map((permissionId) => ({
                    label: permissions.find((p) => p.id === permissionId)?.title || ``,
                    value: permissionId,
                  })) || []
                }
                options={permissions.map((permission) => ({ label: permission?.title, value: permission?.id }))}
                onChange={(value) => onInputChange(`permissions`, value)}
              />

              <SelectInput
                label="Livro"
                placeholder="Selecione o livro do projeto"
                error={errors.book_id}
                value={data.book_id}
                onChange={(bookId) => {
                  onInputChange(`book_id`, bookId);
                }}
                options={books.map((book) => ({ label: book.title, value: book.id }))}
              />

              <Flex justify="space-between" gap="1rem">
                <Flex>
                  <UploadInput label="Substituir thumbnail" accept="image/*" onChange={setThumbToUpload} />
                </Flex>
                {data?.metadata?.thumbnail && <Image src={data.metadata.thumbnail} style={{ maxHeight: `11rem`, borderRadius: `6px` }} />}
              </Flex>
            </Flex>
            <Flex direction="column" gap="1rem" flex="1" maxW="50%">
              <Flex flex="1" direction="column" gap="0.5rem">
                <Flex justify="space-between">
                  <Text fontWeight="500" fontSize="18px">
                    Etapas do projeto
                  </Text>
                  <Button size="small" style={{ width: 'fit-content', alignSelf: `flex-end` }} onClick={handleAddNewStep}>
                    <Flex align="center" gap="0.5rem">
                      <Text>Adicionar etapa</Text>
                      <FaPlus />
                    </Flex>
                  </Button>
                </Flex>
                <Accordion allowMultiple w="100%" fontWeight="500" color="gray700" gap="1rem">
                  {activityParents.map((parent, idx) => (
                    <AccordionItem key={parent + idx} border="1px" borderColor="#ccccccdd" mb="1rem" borderRadius="md" p="0.5rem">
                      <AccordionButton justifyContent="space-between" p="0" gap="0.5rem">
                        <TextInput
                          key={idx + 2}
                          h="2rem"
                          label={`Etapa ${idx + 1}`}
                          size="xs"
                          placeholder="Ex: Planejamento"
                          value={parent}
                          error={parent ? undefined : activityParentError}
                          autoFocus
                          onInputChange={(value) =>
                            setActivityParents((arr) =>
                              arr.map((e, index) => {
                                if (idx === index) e = value;
                                return e;
                              }),
                            )
                          }
                        />
                        <ColorPicker
                          label="Cor"
                          disableEntry
                          disableColorLabel
                          colors={colors.map((e) => e.color)}
                          onChange={(color) =>
                            setActivityColorsByStep((e) => {
                              e[parent] = color;
                              return e;
                            })
                          }
                          color={activityColorsByStep[parent]}
                        />
                        <AccordionIcon />
                      </AccordionButton>
                      <AccordionPanel fontWeight="400" display="flex" justifyContent="flex-end" p="0" w="100%" mt="0.5rem">
                        <Button
                          size="small"
                          style={{ fontSize: `13px` }}
                          onClick={() =>
                            onInputChange(`metadata`, {
                              ...data.metadata,
                              steps: [
                                ...(data?.metadata?.steps || []),
                                {
                                  title: ``,
                                  parent,
                                  description: ``,
                                  position: (data?.metadata?.steps?.length || 0) + 1,
                                  cashback: ``,
                                },
                              ],
                            })
                          }
                        >
                          <Flex align="center" gap="0.5rem">
                            <Text>{parent ? `Adicionar atividades em ${parent}` : `Adicionar atividades`}</Text>
                            <FaPlus />
                          </Flex>
                        </Button>
                      </AccordionPanel>

                      {(data?.metadata?.steps || []).map((step, i) =>
                        step.parent !== parent ? null : (
                          <AccordionPanel fontWeight="400" key={i + 1}>
                            <Flex gap="1rem">
                              <Flex flex="3" align="center">
                                <TextInput
                                  label="Atividade"
                                  size="xs"
                                  p="0.25rem"
                                  h="1.4rem"
                                  value={step.title}
                                  onInputChange={(title) => handleChangeMetadata(data, { title }, i)}
                                />
                              </Flex>
                              <Flex flex="1">
                                <TextInput
                                  label="Cashback"
                                  size="xs"
                                  p="0.25rem"
                                  h="1.4rem"
                                  value={step.cashback}
                                  autoFocus
                                  onInputChange={(value) => handleChangeMetadata(data, { cashback: value?.match(/\d+/g)?.join('') || `` }, i)}
                                />
                              </Flex>
                              <Flex align="flex-end" pb="0.6rem" color="#BA1B1Bdd" onClick={() => handleRemoveMetadataItem(data, i)}>
                                <motion.button whileHover={{ scale: 1.3 }} whileTap={{ scale: 0.9 }}>
                                  <FaTrash />
                                </motion.button>
                              </Flex>
                            </Flex>
                          </AccordionPanel>
                        ),
                      )}
                    </AccordionItem>
                  ))}
                </Accordion>
              </Flex>
            </Flex>
          </Flex>
        </ModalContent>
      </Modal>
      <AlertDialog isOpen={isOpen} leastDestructiveRef={cancelRef} onClose={onClose}>
        <AlertDialogOverlay>
          <AlertDialogContent>
            <AlertDialogHeader fontSize="lg" fontWeight="bold">
              Remover {targetProject?.title}
            </AlertDialogHeader>

            <AlertDialogBody>Tem certeza disso? Essa ação é irreversível.</AlertDialogBody>

            <AlertDialogFooter gap="1rem">
              <Button ref={cancelRef} onClick={onClose} loading={pageIsLoading}>
                Cancelar
              </Button>
              <Button onClick={handleRemoveProject} loading={pageIsLoading}>
                Remover
              </Button>
            </AlertDialogFooter>
          </AlertDialogContent>
        </AlertDialogOverlay>
      </AlertDialog>
    </>
  );
};

const formatTableData = (data: IHubProject): DataType => ({
  key: data.id,
  readable_id: formatReadableId(data.readable_id),
  title: data.title,
  grades: data.grades.reduce((acc, grade) => (acc.length ? acc.concat(` - ${grade}`) : grade), ``),
  created_at: moment(data.created_at).format(`DD/MM/YYYY`),
});

const genericTools = [
  'Tesoura',
  'Agulha',
  'Fita adesiva',
  'Caixas de papelão',
  'Cola quente',
  'Madeira',
  'Garrafas de plástico',
  'Palitos de picolé',
  'Metal',
  'Papel',
  'Cartão',
  'Tinta',
  'Pincéis',
  'Lâmpadas LED',
  'Resistores',
  'Capacitores',
  'Baterias',
  'Fios',
  'Conectores',
  'Placa de circuito impresso',
];
const colors = [
  { color: `#f8bb3c`, pattern: `rockets-amarelo` },
  { color: `#5671b6`, pattern: `rockets-azul-claro` },
  { color: `#1a1740`, pattern: `rockets-azul-marinho` },
  { color: `#3e7aff`, pattern: `rockets-azul` },
  { color: `#20f480`, pattern: `rockets-verde` },
  { color: `#ff515c`, pattern: `rockets-vermelho` },
];
