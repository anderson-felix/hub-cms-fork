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
  useDisclosure,
  useToast,
} from '@chakra-ui/react';

import { FilterConfirmProps } from 'antd/es/table/interface';
import Highlighter from 'react-highlight-words';
import { ModalContent, ShowAction } from './styles';
import { formatReadableId } from '@/_base/utils';
import { useInputHandler } from '@/_base/hooks';
import { GenericButton } from '@/components/Buttons/Generic';
import { IHubModule, IRegisterHubModuleParams, IUpdateHubModuleParams, hubModuleSchema } from '@/_base/interfaces/module';
import { TextInput } from '@/components/Inputs/Text';
import { SelectInput } from '@/components/Inputs/Select';
import { IHubCourse } from '@/_base/interfaces/course';

interface DataType {
  key: string;
  readable_id: string;
  title: string;
  course: string;
  dependency: string;
  lesson_quantity: string;
}
type DataIndex = keyof DataType;

interface IProps {
  dataSource: IHubModule[];
  courses: IHubCourse[];
  openRegisterModal: boolean;
  isLoading: boolean;
  setOpenRegisterModal: React.Dispatch<React.SetStateAction<boolean>>;
  fetchData: () => Promise<void>;
  handleUpdate: (data: IUpdateHubModuleParams, file?: File | null) => Promise<void>;
  handleCreate: (data: IRegisterHubModuleParams, file?: File | null) => Promise<void>;
  handleRemove: (data: IHubModule) => Promise<void>;
}

export const ModulesTable: React.FC<IProps> = ({
  dataSource,
  courses,
  handleCreate,
  handleRemove,
  handleUpdate,
  openRegisterModal,
  setOpenRegisterModal,
  isLoading: pageIsLoading,
}) => {
  const [targetModule, setTargetModule] = useState<IHubModule | null>(null);
  const [tableData, setTableData] = useState<DataType[]>([]);
  const [searchText, setSearchText] = useState('');
  const [searchedColumn, setSearchedColumn] = useState('');
  const [modules, setModules] = useState<IHubModule[]>(dataSource);

  const searchInput = useRef<InputRef>(null);
  const cancelRef = useRef(null);
  const { isOpen, onOpen, onClose } = useDisclosure();
  const toast = useToast();
  const { data, errors, setErrors, onInputChange, submit, setData } = useInputHandler({ schema: hubModuleSchema });

  useEffect(() => {
    setTableData(modules.map(formatTableData));
  }, [modules]);

  useEffect(() => {
    setModules(dataSource);
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
    setModules((e) => e);
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

  const handleOpenModuleModal = (readable_id: string) => {
    const target = modules.find((e) => formatReadableId(e.readable_id) === readable_id);

    if (target) setTargetModule(target);
  };

  const handleUpdateModule = useCallback(async () => {
    if (!targetModule) return;

    const dto: IUpdateHubModuleParams = {
      id: targetModule.id,
      title: targetModule.title,
      description: targetModule.description || undefined,
    };

    await handleUpdate(dto);

    setTargetModule(null);

    toast({ description: 'Curso atualizado!', status: 'success' });
  }, [targetModule]);

  const handleRegisterModule = useCallback(async () => {
    await handleCreate(data);

    setData({} as any);
    setErrors({} as any);
  }, [data]);

  const handleRemoveModule = useCallback(async () => {
    if (!targetModule) return;

    await handleRemove(targetModule);

    setModules((s) => s.filter((e) => e.id !== targetModule.id));
    setTargetModule(null);
    onClose();
  }, [targetModule]);

  const columns: ColumnsType<DataType> = [
    {
      title: 'ID',
      dataIndex: 'readable_id',
      key: 'readable_id',
      ...getColumnSearchProps('readable_id'),
    },
    {
      title: 'Módulo',
      dataIndex: 'title',
      key: 'title',
      ...getColumnSearchProps('title'),
    },
    {
      title: 'Curso',
      dataIndex: 'course',
      key: 'course',
      ...getColumnSearchProps('course'),
    },

    {
      title: 'Dependência',
      dataIndex: 'dependency',
      key: 'dependency',
    },
    {
      title: 'Atividades',
      dataIndex: 'lesson_quantity',
      key: 'lesson_quantity',
    },
    {
      title: 'Visualizar',
      key: 'module',
      render: (_, { readable_id }) => (
        <ShowAction onClick={() => handleOpenModuleModal(readable_id)}>
          <IoOpen />
        </ShowAction>
      ),
    },
  ];

  return (
    <>
      <Table loading={pageIsLoading} columns={columns} dataSource={tableData} size="middle" />

      <Modal
        open={!!targetModule}
        title={targetModule ? `${targetModule.title}` : ''}
        onOk={handleUpdateModule}
        onCancel={() => {
          setTargetModule(null);
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
            value={targetModule?.title}
            onInputChange={(title) => setTargetModule((c) => ({ ...(c || ({} as any)), title }))}
          />
          <TextInput
            label="Descrição"
            p="0.15rem 0.5rem"
            value={targetModule?.description || ``}
            onInputChange={(description) => setTargetModule((c) => ({ ...(c || ({} as any)), description }))}
            error={errors.description}
          />

          <SelectInput
            label="Dependência (opcional)"
            placeholder=""
            allowClear
            value={targetModule?.dependency_id}
            error={errors.dependency_id}
            disabled
            options={modules.map((e) => ({ label: e.title, value: e.id }))}
          />

          <SelectInput
            label="Curso"
            placeholder="Selecione o curso"
            value={targetModule?.hub_course_id}
            disabled
            options={courses.map((course) => ({ label: course.title, value: course.id }))}
          />
        </ModalContent>
      </Modal>
      <Modal
        open={openRegisterModal}
        title={`Cadastrar curso`}
        onOk={() => submit(handleRegisterModule)}
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

          <SelectInput
            label="Dependência (opcional)"
            placeholder=""
            allowClear
            value={data.dependency_id}
            error={errors.dependency_id}
            onChange={(e) => onInputChange(`dependency_id`, e)}
            options={modules.map((e) => ({ label: e.title, value: e.id }))}
          />

          <SelectInput
            label="Curso"
            placeholder="Selecione o curso"
            value={data?.hub_course_id}
            error={errors.hub_course_id}
            onChange={(e) => onInputChange(`hub_course_id`, e)}
            options={courses.map((course) => ({ label: course.title, value: course.id }))}
          />
        </ModalContent>
      </Modal>
      <AlertDialog isOpen={isOpen} leastDestructiveRef={cancelRef} onClose={onClose}>
        <AlertDialogOverlay>
          <AlertDialogContent>
            <AlertDialogHeader fontSize="lg" fontWeight="bold">
              Remover {targetModule?.title}
            </AlertDialogHeader>

            <AlertDialogBody>Tem certeza disso? Essa ação é irreversível.</AlertDialogBody>

            <AlertDialogFooter gap="1rem">
              <Button ref={cancelRef} onClick={onClose} loading={pageIsLoading}>
                Cancelar
              </Button>
              <Button onClick={handleRemoveModule} loading={pageIsLoading}>
                Remover
              </Button>
            </AlertDialogFooter>
          </AlertDialogContent>
        </AlertDialogOverlay>
      </AlertDialog>
    </>
  );
};

const formatTableData = (data: IHubModule): DataType => ({
  key: data.id,
  readable_id: formatReadableId(data.readable_id),
  title: data.title,
  course: data.course?.title || `-`,
  lesson_quantity: `${data.lessons?.length || 0}`,
  dependency: data.dependency?.title || `-`,
});
