import React, { useCallback, useEffect, useRef, useState } from 'react';
import { Space, Table, Input, Button, InputRef, Modal, Image } from 'antd';
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
import { formatClassGrade, formatReadableId, scopeLabelMapper } from '@/_base/utils';
import { useInputHandler } from '@/_base/hooks';
import { GenericButton } from '@/components/Buttons/Generic';
import { EMPTY_COURSE_SCHEMA_DATA, IHubCourse, IRegisterHubCourseParams, IUpdateHubCourseParams, hubCourseSchema } from '@/_base/interfaces/course';
import { TextInput } from '@/components/Inputs/Text';
import { SelectInput } from '@/components/Inputs/Select';
import { UploadInput, useBaseUploadInput } from '@/components/Inputs/Upload/Base';
import { RadioInput } from '@/components/Inputs/RadioInput';
import { IHubPermission } from '@/_base/interfaces/permission';

interface DataType {
  key: string;
  readable_id: string;
  title: string;
  scope: string;
  grades: string;
  dependency: string;
}
type DataIndex = keyof DataType;

interface IProps {
  dataSource: IHubCourse[];
  permissions: IHubPermission[];
  availableGrades: string[];
  openRegisterModal: boolean;
  isLoading: boolean;
  setOpenRegisterModal: React.Dispatch<React.SetStateAction<boolean>>;
  fetchData: () => Promise<void>;
  handleUpdate: (data: IUpdateHubCourseParams, file?: File | null) => void;
  handleCreate: (data: IRegisterHubCourseParams, file?: File | null) => void;
  handleRemove: (data: IHubCourse) => void;
}

export const CoursesTable: React.FC<IProps> = ({
  dataSource,
  availableGrades,
  permissions,
  handleCreate,
  handleRemove,
  handleUpdate,
  openRegisterModal,
  setOpenRegisterModal,
  isLoading: pageIsLoading,
}) => {
  const [targetCourse, setTargetCourse] = useState<IHubCourse | null>(null);
  const [tableData, setTableData] = useState<DataType[]>([]);
  const [searchText, setSearchText] = useState('');
  const [searchedColumn, setSearchedColumn] = useState('');
  const [courses, setCourses] = useState<IHubCourse[]>(dataSource);
  const [fileToUpload, setFileToUpload] = useState<File | null>(null);

  const searchInput = useRef<InputRef>(null);
  const cancelRef = useRef(null);
  const { isOpen, onOpen, onClose } = useDisclosure();
  const { clearFileList } = useBaseUploadInput();
  const toast = useToast();
  const { data, errors, setErrors, onInputChange, submit, setData } = useInputHandler({ data: EMPTY_COURSE_SCHEMA_DATA, schema: hubCourseSchema });

  useEffect(() => {
    setTableData(courses.map(formatTableData));
  }, [courses]);

  useEffect(() => {
    setCourses(dataSource);
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
    setCourses((e) => e);
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

  const handleOpenCourseModal = (readable_id: string) => {
    const target = courses.find((e) => formatReadableId(e.readable_id) === readable_id);

    if (target) setTargetCourse(target);
  };

  const handleUpdateCourse = useCallback(() => {
    if (!targetCourse) return;

    const dto: IUpdateHubCourseParams = {
      id: targetCourse.id,
      title: targetCourse.title,
      description: targetCourse.description || undefined,
      dependency_id: targetCourse.dependency_id || undefined,
      thumbnail: targetCourse.thumbnail || undefined,
      permissions: targetCourse.content_permission_links?.map((link) => link.permission.id),
    };

    handleUpdate(dto, fileToUpload);

    setTargetCourse(null);
    clearFileList();
    setFileToUpload(null);
    toast({ description: 'Curso atualizado!', status: 'success' });
  }, [targetCourse, fileToUpload]);

  const handleRegisterCourse = useCallback(() => {
    handleCreate(data, fileToUpload);

    setData(EMPTY_COURSE_SCHEMA_DATA);
    setErrors({} as any);
    clearFileList();
    setFileToUpload(null);
  }, [data, fileToUpload]);

  const handleRemoveCourse = useCallback(() => {
    if (!targetCourse) return;

    handleRemove(targetCourse);

    setCourses((s) => s.filter((e) => e.id !== targetCourse.id));
    setTargetCourse(null);
    onClose();
  }, [targetCourse]);

  const columns: ColumnsType<DataType> = [
    {
      title: 'ID',
      dataIndex: 'readable_id',
      key: 'readable_id',
      ...getColumnSearchProps('readable_id'),
    },
    {
      title: 'Curso',
      dataIndex: 'title',
      key: 'title',
      ...getColumnSearchProps('title'),
    },
    {
      title: 'Escopo',
      dataIndex: 'scope',
      key: 'scope',
      ...getColumnSearchProps('scope'),
    },
    {
      title: 'Anos',
      dataIndex: 'grades',
      key: 'grades',
    },
    {
      title: 'Dependência',
      dataIndex: 'dependency',
      key: 'dependency',
    },
    {
      title: 'Visualizar',
      key: 'course',
      render: (_, { readable_id }) => (
        <ShowAction onClick={() => handleOpenCourseModal(readable_id)}>
          <IoOpen />
        </ShowAction>
      ),
    },
  ];

  return (
    <>
      <Table loading={pageIsLoading} columns={columns} dataSource={tableData} size="middle" />

      <Modal
        open={!!targetCourse}
        title={targetCourse ? `${targetCourse.title}` : ''}
        onOk={handleUpdateCourse}
        onCancel={() => {
          setTargetCourse(null);
          clearFileList();
          setFileToUpload(null);
        }}
        okText="Salvar"
        cancelText="Cancelar"
        confirmLoading={pageIsLoading}
      >
        <ModalContent>
          <Flex pt="0.75rem" borderColor="gray300" justify="space-between">
            <RadioInput
              title="Escopo do curso"
              error={errors.scope}
              options={[
                { label: 'Professor', value: 'teacher' },
                { label: 'Aluno', value: 'student' },
              ]}
              initialValue={targetCourse?.scope}
              onInputChange={(scope) => setTargetCourse((c) => ({ ...(c || ({} as any)), scope }))}
              isHorizontal
              disabled
            />

            <GenericButton size="xs" label="Excluir" btntype="outline-warning" rightIcon={<FaTrash />} onClick={onOpen} />
          </Flex>
          <TextInput
            label="Nome"
            p="0.15rem 0.5rem"
            error={errors.title}
            value={targetCourse?.title}
            onInputChange={(title) => setTargetCourse((c) => ({ ...(c || ({} as any)), title }))}
          />
          <TextInput
            label="Descrição"
            p="0.15rem 0.5rem"
            value={targetCourse?.description || ``}
            onInputChange={(description) => setTargetCourse((c) => ({ ...(c || ({} as any)), description }))}
            error={errors.description}
          />

          <SelectInput
            label="Dependência (opcional)"
            placeholder=""
            allowClear
            error={errors.dependency_id}
            disabled
            value={targetCourse?.dependency_id}
            options={courses.map((e) => ({ label: e.title, value: e.id }))}
          />

          <SelectInput
            label="Anos"
            placeholder="Selecione os anos"
            error={errors.grades}
            mode="multiple"
            value={targetCourse?.grades}
            disabled
            options={availableGrades.map((grade) => ({ label: grade, value: grade }))}
          />
          <SelectInput
            label="Permissões"
            placeholder="Selecione as permissões"
            mode="multiple"
            value={targetCourse?.content_permission_links?.map((link) => ({ label: link.permission.title, value: link.permission.id })) || []}
            options={permissions.map((permission) => ({ label: permission.title, value: permission.id }))}
            onChange={(ids: string[]) =>
              setTargetCourse((_course) => ({
                ...(_course || ({} as any)),
                content_permission_links: ids.map((id) => ({ id, permission: permissions.find((p) => p.id === id) })),
              }))
            }
          />

          <Flex justify="space-between" gap="1rem">
            <Flex>
              <UploadInput label="Substituir thumbnail" accept="image/*" onChange={setFileToUpload} />
            </Flex>
            {targetCourse?.thumbnail && <Image src={targetCourse?.thumbnail} style={{ maxHeight: `11rem`, borderRadius: `6px` }} />}
          </Flex>
        </ModalContent>
      </Modal>
      <Modal
        open={openRegisterModal}
        title={`Cadastrar curso`}
        onOk={() => submit(handleRegisterCourse)}
        onCancel={() => {
          setOpenRegisterModal(false);
          clearFileList();
          setFileToUpload(null);
        }}
        okText="Cadastrar"
        cancelText="Cancelar"
        confirmLoading={pageIsLoading}
      >
        <ModalContent>
          <Flex pt="0.75rem" borderColor="gray300">
            <RadioInput
              title="Escopo do curso"
              error={errors.scope}
              options={[
                { label: 'Professor', value: 'teacher' },
                { label: 'Aluno', value: 'student' },
              ]}
              initialValue={data.scope}
              onInputChange={(scope) => onInputChange(`scope`, scope)}
              isHorizontal
            />
          </Flex>
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
            options={courses.map((e) => ({ label: e.title, value: e.id }))}
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
            label="Permissões"
            placeholder="Selecione as permissões"
            mode="multiple"
            value={
              data.permissions?.map((permissionId) => ({
                label: permissions.find((p) => p.id === permissionId)?.title || ``,
                value: permissionId,
              })) || []
            }
            options={permissions.map((permission) => ({ label: permission.title, value: permission.id }))}
            onChange={(value) => onInputChange(`permissions`, value)}
          />

          <UploadInput label="Thumbnail" accept="image/*" onChange={setFileToUpload} />
        </ModalContent>
      </Modal>
      <AlertDialog isOpen={isOpen} leastDestructiveRef={cancelRef} onClose={onClose}>
        <AlertDialogOverlay>
          <AlertDialogContent>
            <AlertDialogHeader fontSize="lg" fontWeight="bold">
              Remover {targetCourse?.title}
            </AlertDialogHeader>

            <AlertDialogBody>Tem certeza disso? Essa ação é irreversível.</AlertDialogBody>

            <AlertDialogFooter gap="1rem">
              <Button ref={cancelRef} onClick={onClose} loading={pageIsLoading}>
                Cancelar
              </Button>
              <Button onClick={handleRemoveCourse} loading={pageIsLoading}>
                Remover
              </Button>
            </AlertDialogFooter>
          </AlertDialogContent>
        </AlertDialogOverlay>
      </AlertDialog>
    </>
  );
};

const formatTableData = (data: IHubCourse): DataType => ({
  key: data.id,
  readable_id: formatReadableId(data.readable_id),
  title: data.title,
  scope: scopeLabelMapper[data.scope],
  grades: data.grades.reduce((acc, grade) => (acc.length ? acc.concat(` - ${grade}`) : grade), ``),
  dependency: data.dependency?.title || `-`,
});
