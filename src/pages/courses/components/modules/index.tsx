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
  useToast,
} from '@chakra-ui/react';

import { FilterConfirmProps } from 'antd/es/table/interface';
import Highlighter from 'react-highlight-words';
import { ModalContent, ShowAction } from './styles';
import { formatReadableId } from '@/_base/utils';
import { useInputHandler } from '@/_base/hooks';
import { GenericButton } from '@/components/Buttons/Generic';
import { EMPTY_HUB_MODULE, IHubModule, IRegisterHubModuleParams, IUpdateHubModuleParams, hubModuleSchema } from '@/_base/interfaces/module';
import { TextInput } from '@/components/Inputs/Text';
import { SelectInput } from '@/components/Inputs/Select';
import { IHubCourse } from '@/_base/interfaces/course';
import { CoursePageViewType } from '../../interfaces';
import { FaEdit } from 'react-icons/fa';

interface DataType {
  key: string;
  readable_id: string;
  title: string;
  course: string;
  dependency: string;
  lesson_quantity: string;
  position: number;
}
type DataIndex = keyof DataType;

interface IProps {
  dataSource: IHubModule[];
  courses: IHubCourse[];
  openRegisterModal: boolean;
  isLoading: boolean;
  setOpenRegisterModal: React.Dispatch<React.SetStateAction<boolean>>;
  filter: Record<string, string>;
  fetchData: () => Promise<void>;
  handleUpdate: (data: IUpdateHubModuleParams, file?: File | null) => Promise<void>;
  handleCreate: (data: IRegisterHubModuleParams, file?: File | null) => Promise<void>;
  handleRemove: (data: IHubModule) => Promise<void>;
  handleFilter: (data: Record<string, string>, targetPage: CoursePageViewType) => void;
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
  filter,
  handleFilter,
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
  const { data, errors, setErrors, onInputChange, submit, setData } = useInputHandler<IRegisterHubModuleParams>({
    schema: hubModuleSchema,
    data: EMPTY_HUB_MODULE,
  });

  useEffect(() => {
    const key = Object.keys(filter)[0];
    setTableData(
      modules
        .sort((a, b) => a.readable_id - b.readable_id)
        .filter((e) => !key || e[key as keyof IHubModule] === filter[key])
        .map((m) => formatTableData(m, courses)),
    );
  }, [modules, filter]);

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
      position: targetModule.position,
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
      title: 'Posição',
      dataIndex: 'position',
      key: 'position',
    },
    {
      title: 'Ver atividades',
      key: 'view_module',
      align: `center`,
      width: `150px`,
      render: (_, { key }) => (
        <ShowAction onClick={() => handleFilter({ module_id: key }, `module_lesson`)}>
          <IoOpen color="#C1DCFF" />
        </ShowAction>
      ),
    },
    {
      title: 'Editar',
      key: 'module',
      align: `center`,
      width: `80px`,
      render: (_, { readable_id }) => (
        <ShowAction onClick={() => handleOpenModuleModal(readable_id)}>
          <FaEdit />
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

          <Flex align="center" gap="1rem" justify="flex-end">
            <Text color="gray500" fontWeight="500">
              Posição
            </Text>
            <NumberInput
              borderColor="gray300"
              w="5rem"
              value={targetModule?.position}
              onChange={(value) => setTargetModule((c) => ({ ...(c || ({} as any)), position: Number(value) }))}
            >
              <NumberInputField borderColor="gray300" />
              <NumberInputStepper borderColor="gray300">
                <NumberIncrementStepper borderColor="gray300" fontSize="10px" />
                <NumberDecrementStepper borderColor="gray300" fontSize="10px" />
              </NumberInputStepper>
            </NumberInput>
          </Flex>

          <SelectInput
            label="Dependência (opcional)"
            placeholder=""
            allowClear
            value={targetModule?.dependency_id}
            error={errors.dependency_id}
            disabled
            options={modules.map((e) => ({ label: `${e.title} - ${courses.find((c) => c.id === e.hub_course_id)?.title || ``}`, value: e.id }))}
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
        title={`Cadastrar módulo`}
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

          <Flex align="center" gap="1rem" justify="flex-end">
            <Text color="gray500" fontWeight="500">
              Posição
            </Text>
            <NumberInput borderColor="gray300" w="5rem" value={data.position} onChange={(value) => onInputChange(`position`, Number(value))}>
              <NumberInputField borderColor="gray300" />
              <NumberInputStepper borderColor="gray300">
                <NumberIncrementStepper borderColor="gray300" fontSize="10px" />
                <NumberDecrementStepper borderColor="gray300" fontSize="10px" />
              </NumberInputStepper>
            </NumberInput>
          </Flex>

          <SelectInput
            label="Dependência (opcional)"
            placeholder=""
            allowClear
            value={data.dependency_id}
            error={errors.dependency_id}
            onChange={(e) => onInputChange(`dependency_id`, e)}
            options={modules.map((e) => ({ label: `${e.title}  ( ${courses.find((c) => c.id === e.hub_course_id)?.title || ``} )`, value: e.id }))}
          />

          <SelectInput
            label="Curso"
            placeholder="Selecione o curso"
            value={data?.hub_course_id}
            error={errors.hub_course_id}
            onChange={(e) => onInputChange(`hub_course_id`, e)}
            options={courses.map((course) => ({ label: `${course.title} (${course.scope})`, value: course.id }))}
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

const formatTableData = (mod: IHubModule, courses: IHubCourse[]): DataType => ({
  key: mod.id,
  readable_id: formatReadableId(mod.readable_id),
  title: mod.title,
  course: mod.course?.title || courses.find((c) => c.id === mod.hub_course_id)?.title || `-`,
  lesson_quantity: `${mod.lessons?.length || 0}`,
  dependency: mod.dependency?.title || `-`,
  position: mod.position,
});
