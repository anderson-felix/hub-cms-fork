import React, { useCallback, useEffect, useRef, useState } from 'react';
import { Space, Table, Input, Button, InputRef, Modal } from 'antd';
import { SearchOutlined } from '@ant-design/icons';
import { IoOpen } from 'react-icons/io5';
import { FaTrash } from 'react-icons/fa6';
import type { ColumnType, ColumnsType } from 'antd/es/table';
import {
  AlertDialog,
  AlertDialogBody,
  AlertDialogContent,
  AlertDialogFooter,
  AlertDialogHeader,
  AlertDialogOverlay,
  Flex,
  NumberDecrementStepper,
  NumberIncrementStepper,
  NumberInput,
  NumberInputField,
  NumberInputStepper,
  Text,
  useDisclosure,
} from '@chakra-ui/react';

import { FilterConfirmProps } from 'antd/es/table/interface';
import Highlighter from 'react-highlight-words';
import { ModalContent, ShowAction } from './styles';
import { formatReadableId } from '@/_base/utils';
import { useCustomRouter, useCustomToast, useInputHandler } from '@/_base/hooks';
import { GenericButton } from '@/components/Buttons/Generic';
import {
  IHubModuleLesson,
  IRegisterHubModuleLessonParams,
  IUpdateHubModuleLessonParams,
  hubModuleLessonSchema,
} from '@/_base/interfaces/moduleLesson';
import { TextInput } from '@/components/Inputs/Text';
import { SelectInput } from '@/components/Inputs/Select';
import { IHubModule } from '@/_base/interfaces/module';
import { IHubVideo } from '@/_base/interfaces/video';

interface DataType {
  key: string;
  readable_id: string;
  title: string;
  module: string;
  video: string;
  lesson_type: string;
  position: string;
}
type DataIndex = keyof DataType;

interface IProps {
  dataSource: IHubModuleLesson[];
  modules: IHubModule[];
  videos: IHubVideo[];
  openRegisterModal: boolean;
  isLoading: boolean;
  setOpenRegisterModal: React.Dispatch<React.SetStateAction<boolean>>;
  fetchData: () => Promise<void>;
  handleUpdate: (data: IUpdateHubModuleLessonParams) => Promise<void>;
  handleCreate: (data: IRegisterHubModuleLessonParams) => Promise<void>;
  handleRemove: (data: IHubModuleLesson) => Promise<void>;
}

export const LessonsTable: React.FC<IProps> = ({
  dataSource,
  modules,
  videos,
  handleCreate,
  handleRemove,
  handleUpdate,
  openRegisterModal,
  setOpenRegisterModal,
  isLoading: pageIsLoading,
}) => {
  const [targetLesson, setTargetLesson] = useState<IHubModuleLesson | null>(null);
  const [tableData, setTableData] = useState<DataType[]>([]);
  const [searchText, setSearchText] = useState('');
  const [searchedColumn, setSearchedColumn] = useState('');
  const [courses, setLessons] = useState<IHubModuleLesson[]>(dataSource);

  const searchInput = useRef<InputRef>(null);
  const cancelRef = useRef(null);
  const { isOpen, onOpen, onClose } = useDisclosure();
  const toast = useCustomToast();
  const router = useCustomRouter();
  const { data, errors, setErrors, onInputChange, submit, setData } = useInputHandler({ schema: hubModuleLessonSchema });

  useEffect(() => {
    setTableData(courses.map(formatTableData));
  }, [courses]);

  useEffect(() => {
    setLessons(dataSource);
  }, [dataSource]);

  const handleSearch = (selectedKeys: string[], confirm: (param?: FilterConfirmProps) => void, dataIndex: DataIndex) => {
    confirm();
    setSearchText(selectedKeys[0]);
    setSearchedColumn(dataIndex);
  };

  const handleReset = (clearFilters: () => void) => {
    clearFilters();
    setSearchText('');
    setSearchedColumn(``);
    setLessons((e) => e);
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

  const handleOpenLessonModal = (readable_id: string) => {
    const target = courses.find((e) => formatReadableId(e.readable_id) === readable_id);

    if (target) router.push(`/courses/${target?.module?.hub_course_id}/${target?.module_id}/${target?.id}`);
  };

  const handleUpdateLesson = useCallback(async () => {
    if (!targetLesson) return;

    const dto: IUpdateHubModuleLessonParams = {
      id: targetLesson.id,
      title: targetLesson.title,
      position: targetLesson.position,
      description: targetLesson.description || undefined,
      metadata: targetLesson.metadata || undefined,
      video_id: targetLesson.video_id || undefined,
    };

    await handleUpdate(dto);

    setTargetLesson(null);
    toast({ description: 'Atividade atualizada!', status: 'success' });
  }, [targetLesson]);

  const handleRegisterLesson = useCallback(async () => {
    await handleCreate(data);

    setData({} as any);
    setErrors({} as any);
  }, [data]);

  const handleRemoveLesson = useCallback(async () => {
    if (!targetLesson) return;

    await handleRemove(targetLesson);

    setLessons((s) => s.filter((e) => e.id !== targetLesson.id));
    setTargetLesson(null);
    onClose();
  }, [targetLesson]);

  const columns: ColumnsType<DataType> = [
    {
      title: 'ID',
      dataIndex: 'readable_id',
      key: 'readable_id',
      ...getColumnSearchProps('readable_id'),
    },
    {
      title: 'Atividade',
      dataIndex: 'title',
      key: 'title',
      ...getColumnSearchProps('title'),
    },
    {
      title: 'Módulo',
      dataIndex: 'module',
      key: 'module',
      ...getColumnSearchProps('module'),
    },
    {
      title: 'Vídeo',
      dataIndex: 'video',
      key: 'video',
      ...getColumnSearchProps('video'),
    },
    {
      title: 'Tipo',
      dataIndex: 'lesson_type',
      key: 'lesson_type',
      ...getColumnSearchProps('lesson_type'),
    },
    {
      title: 'Posição',
      dataIndex: 'position',
      key: 'position',
    },
    {
      title: 'Visualizar',
      key: 'course',
      render: (_, { readable_id }) => (
        <ShowAction onClick={() => handleOpenLessonModal(readable_id)}>
          <IoOpen />
        </ShowAction>
      ),
    },
  ];

  return (
    <>
      <Table loading={pageIsLoading} columns={columns} dataSource={tableData} size="middle" />

      <Modal
        open={!!targetLesson}
        title={targetLesson ? `${targetLesson.title}` : ''}
        onOk={handleUpdateLesson}
        onCancel={() => {
          setTargetLesson(null);
        }}
        okText="Salvar"
        cancelText="Cancelar"
        confirmLoading={pageIsLoading}
      >
        <ModalContent>
          <Flex pt="0.75rem" borderColor="gray300" justify="flex-end">
            <GenericButton size="xs" label="Excluir" btntype="outline-warning" rightIcon={<FaTrash />} onClick={onOpen} />
          </Flex>
          <TextInput
            label="Nome"
            p="0.15rem 0.5rem"
            value={targetLesson?.title}
            onInputChange={(title) => setTargetLesson((c) => ({ ...(c || ({} as any)), title }))}
          />
          <TextInput
            label="Descrição"
            p="0.15rem 0.5rem"
            value={targetLesson?.description || ``}
            onInputChange={(description) => setTargetLesson((c) => ({ ...(c || ({} as any)), description }))}
            error={errors.description}
          />

          <NumberInput />

          <SelectInput
            label="Módulo"
            placeholder="Selecione o módulo"
            disabled
            value={targetLesson?.module_id}
            options={modules.map((e) => ({ label: e.title, value: e.id }))}
          />

          <SelectInput
            label="Vídeo"
            value={targetLesson?.video_id}
            error={errors.video_id}
            options={videos.map((e) => ({ label: e.title, value: e.id }))}
            onChange={(video_id) => setTargetLesson((c) => ({ ...(c || ({} as any)), video_id }))}
          />
        </ModalContent>
      </Modal>
      <Modal
        open={openRegisterModal}
        title={`Cadastrar atividade`}
        onOk={() => submit(handleRegisterLesson)}
        onCancel={() => {
          setOpenRegisterModal(false);
        }}
        okText="Cadastrar"
        cancelText="Cancelar"
        confirmLoading={pageIsLoading}
      >
        <ModalContent>
          <TextInput
            label="Nome"
            p="0.15rem 0.5rem"
            value={data.title}
            onInputChange={(value) => onInputChange(`title`, value)}
            error={errors.title}
          />
          <TextInput
            label="Descrição"
            p="0.15rem 0.5rem"
            value={data.description || ``}
            onInputChange={(value) => onInputChange(`description`, value)}
            error={errors.description}
          />

          <Flex align="center" gap="1rem" justify="flex-end">
            <Text color="gray500" fontWeight="500">
              Posição
            </Text>
            <NumberInput borderColor="gray300" w="5rem" value={data.position} onChange={(value) => onInputChange(`position`, value)}>
              <NumberInputField borderColor="gray300" />
              <NumberInputStepper borderColor="gray300">
                <NumberIncrementStepper borderColor="gray300" fontSize="10px" />
                <NumberDecrementStepper borderColor="gray300" fontSize="10px" />
              </NumberInputStepper>
            </NumberInput>
          </Flex>

          <SelectInput
            label="Módulo"
            placeholder="Selecione o módulo"
            value={data.module_id}
            error={errors.module_id}
            onChange={(e) => onInputChange(`module_id`, e)}
            options={modules.map((e) => ({ label: `${e.title} (${e.course.title})`, value: e.id }))}
          />

          <SelectInput
            label="Vídeo"
            value={data.video_id}
            error={errors.video_id}
            options={videos.map((e) => ({ label: `${e.title} (${e.category.display_name})`, value: e.id }))}
            onChange={(e) => onInputChange(`video_id`, e)}
          />
        </ModalContent>
      </Modal>
      <AlertDialog isOpen={isOpen} leastDestructiveRef={cancelRef} onClose={onClose}>
        <AlertDialogOverlay>
          <AlertDialogContent>
            <AlertDialogHeader fontSize="lg" fontWeight="bold">
              Remover {targetLesson?.title}
            </AlertDialogHeader>

            <AlertDialogBody>Tem certeza disso? Essa ação é irreversível.</AlertDialogBody>

            <AlertDialogFooter gap="1rem">
              <Button ref={cancelRef} onClick={onClose} loading={pageIsLoading}>
                Cancelar
              </Button>
              <Button onClick={handleRemoveLesson} loading={pageIsLoading}>
                Remover
              </Button>
            </AlertDialogFooter>
          </AlertDialogContent>
        </AlertDialogOverlay>
      </AlertDialog>
    </>
  );
};

const formatTableData = (data: IHubModuleLesson): DataType => ({
  key: data.id,
  readable_id: formatReadableId(data.readable_id),
  title: data.title,
  module: data.module?.title || `-`,
  video: data.video?.title || `-`,
  lesson_type: data.lesson_type,
  position: `${data.position}`,
});
