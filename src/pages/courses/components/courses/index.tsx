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
  Link,
  Text,
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
import { CoursePageViewType } from '../../interfaces';
import { FaEdit, FaExternalLinkAlt } from 'react-icons/fa';
import { MediaUploadInput, useMediaUploadInput } from '@/components/Inputs/Upload/MediaUpload';
import { FileUploadInput, useFileUploadInput } from '@/components/Inputs/Upload/FIleUpload';

interface DataType {
  key: string;
  readable_id: string;
  title: string;
  scope: string;
  grades: string;
  dependency: string;
}
type DataIndex = keyof DataType;

export type CourseUploadParams = { courseThumbnail?: File | null; certThumbnail?: File | null; certTemplate?: File | null };

interface IProps {
  dataSource: IHubCourse[];
  permissions: IHubPermission[];
  availableGrades: string[];
  openRegisterModal: boolean;
  isLoading: boolean;
  setOpenRegisterModal: React.Dispatch<React.SetStateAction<boolean>>;
  fetchData: () => Promise<void>;
  handleUpdate: (data: IUpdateHubCourseParams & CourseUploadParams) => void;
  handleCreate: (data: IRegisterHubCourseParams & CourseUploadParams) => void;
  handleRemove: (data: IHubCourse) => void;
  handleFilter: (data: Record<string, string>, targetPage: CoursePageViewType) => void;
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
  handleFilter,
}) => {
  const [targetCourse, setTargetCourse] = useState<IHubCourse | null>(null);
  const [tableData, setTableData] = useState<DataType[]>([]);
  const [searchText, setSearchText] = useState('');
  const [searchedColumn, setSearchedColumn] = useState('');
  const [courses, setCourses] = useState<IHubCourse[]>(dataSource);
  const [courseThumbnailToUpload, setCourseThumbnailToUpload] = useState<File | null>(null);
  const [certThumbnailToUpload, setCertThumbnailToUpload] = useState<File | null>(null);
  const [certTemplateToUpload, setCertTemplateToUpload] = useState<File | null>(null);

  const searchInput = useRef<InputRef>(null);
  const cancelRef = useRef(null);
  const { isOpen, onOpen, onClose } = useDisclosure();
  const { clearFileList } = useBaseUploadInput();
  const { clearFileList: clearThumbList } = useFileUploadInput();
  const { clearFileList: clearMediaList } = useMediaUploadInput();
  const toast = useToast();
  const { data, errors, setErrors, onInputChange, submit, setData } = useInputHandler<IRegisterHubCourseParams>({
    data: EMPTY_COURSE_SCHEMA_DATA,
    schema: hubCourseSchema,
  });

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

  const onCloseModal = () => {
    setTargetCourse(null);
    clearFileList();
    clearThumbList();
    clearMediaList();
    setCourseThumbnailToUpload(null);
    setCertThumbnailToUpload(null);
    setCertTemplateToUpload(null);
    setOpenRegisterModal(false);
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

    const dto: IUpdateHubCourseParams & CourseUploadParams = {
      id: targetCourse.id,
      title: targetCourse.title,
      description: targetCourse.description || undefined,
      dependency_id: targetCourse.dependency_id || undefined,
      thumbnail: targetCourse.thumbnail || undefined,
      permissions: targetCourse.content_permission_links?.map((link) => link.permission.id),
      certificate_templates: targetCourse.certificate_templates,
      courseThumbnail: courseThumbnailToUpload,
      certThumbnail: certThumbnailToUpload,
      certTemplate: certTemplateToUpload,
    };

    handleUpdate(dto);

    setTargetCourse(null);
    clearFileList();
    setCourseThumbnailToUpload(null);
    toast({ description: 'Curso atualizado!', status: 'success' });
  }, [targetCourse, courseThumbnailToUpload, certThumbnailToUpload, certTemplateToUpload]);

  const handleRegisterCourse = useCallback(() => {
    const params: IRegisterHubCourseParams & CourseUploadParams = data;

    params.courseThumbnail = courseThumbnailToUpload;
    params.certThumbnail = certThumbnailToUpload;
    params.certTemplate = certTemplateToUpload;

    handleCreate(params);

    setData(EMPTY_COURSE_SCHEMA_DATA);
    setErrors({} as any);
    clearFileList();
    setCourseThumbnailToUpload(null);
  }, [data, courseThumbnailToUpload, certThumbnailToUpload, certTemplateToUpload]);

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
      title: 'Visualizar módulos',
      key: 'module_view',
      align: `center`,
      width: `150px`,
      render: (_, { key }) => (
        <ShowAction onClick={() => handleFilter({ hub_course_id: key }, `module`)}>
          <IoOpen color="#C1DCFF" />
        </ShowAction>
      ),
    },
    {
      title: 'Editar',
      key: 'course',
      align: `center`,
      width: `80px`,
      render: (_, { readable_id }) => (
        <ShowAction onClick={() => handleOpenCourseModal(readable_id)}>
          <FaEdit />
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
        width={680}
        onCancel={onCloseModal}
        okText="Salvar"
        cancelText="Cancelar"
        confirmLoading={pageIsLoading}
        style={{ overflow: `hidden !important` }}
      >
        <ModalContent style={{ overflow: `hidden auto` }}>
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
              <UploadInput label="Substituir thumbnail" accept="image/*" onChange={setCourseThumbnailToUpload} />
            </Flex>
            {targetCourse?.thumbnail && <Image src={targetCourse?.thumbnail} style={{ maxHeight: `11rem`, borderRadius: `6px` }} />}
          </Flex>

          <Flex direction="column" gap="1rem" border="1px" borderRadius="md" borderColor="#4d4f5c33" p="0.5rem 1rem 1rem">
            <Text fontWeight="500" fontSize="18px" color="GrayText">
              Template de certificado
            </Text>

            <TextInput
              label="Título do certificado"
              p="0.15rem 0.5rem"
              value={targetCourse?.certificate_templates.length ? targetCourse?.certificate_templates[0]?.title || `` : ``}
              onInputChange={(title) =>
                setTargetCourse((c) => ({ ...(c || ({} as any)), certificate_templates: [{ ...(c?.certificate_templates.at(0) || {}), title }] }))
              }
              error={errors.certificate_templates}
            />

            <Flex gap="1rem">
              <Flex gap="1rem" flex="1" direction="column">
                <Flex>
                  <MediaUploadInput label="Substituir thumbnail" accept="image/*" onChange={setCertThumbnailToUpload} width="18rem" />
                </Flex>
                {!!targetCourse?.certificate_templates?.length && !!targetCourse?.certificate_templates[0].thumbnail && (
                  <Image src={targetCourse?.certificate_templates[0].thumbnail} style={{ maxHeight: `11rem`, borderRadius: `6px` }} />
                )}
              </Flex>
              <Flex gap="1rem" flex="1" direction="column">
                <Flex>
                  <FileUploadInput label="Substituir template" accept="application/pdf" onChange={setCertTemplateToUpload} width="18rem" />
                </Flex>
                {!!targetCourse?.certificate_templates.length && !!targetCourse?.certificate_templates[0].link && (
                  <Link
                    href={targetCourse?.certificate_templates[0]?.link}
                    target="_blank"
                    border="1px"
                    borderColor="gray300"
                    borderRadius="md"
                    p="0.25rem 0.5rem"
                    display="flex"
                    alignItems="center"
                    gap="0.5rem"
                    color="gray600"
                  >
                    <FaExternalLinkAlt />
                    <Text fontSize="13px">{targetCourse?.certificate_templates[0]?.title}</Text>
                  </Link>
                )}
              </Flex>
            </Flex>
          </Flex>
        </ModalContent>
      </Modal>
      <Modal
        open={openRegisterModal}
        title={`Cadastrar curso`}
        onOk={() => submit(handleRegisterCourse)}
        onCancel={onCloseModal}
        okText="Cadastrar"
        width={680}
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

          <UploadInput label="Thumbnail do curso" accept="image/*" onChange={setCourseThumbnailToUpload} />

          <Flex direction="column" gap="1rem" border="1px" borderRadius="md" borderColor="#4d4f5c33" p="0.5rem 1rem 1rem">
            <Text fontWeight="500" fontSize="18px" color="GrayText">
              Template de certificado
            </Text>

            <TextInput
              label="Título do certificado"
              p="0.15rem 0.5rem"
              value={data?.certificate_templates?.length ? data?.certificate_templates[0]?.title || `` : ``}
              onInputChange={(title) => onInputChange(`certificate_templates`, [{ ...(data.certificate_templates?.at(0) || {}), title }])}
              error={errors.certificate_templates}
            />

            <Flex>
              <Flex gap="1rem" flex="1" direction="column">
                <Flex>
                  <MediaUploadInput label="Thumbnail" accept="image/*" onChange={setCertThumbnailToUpload} width="18rem" />
                </Flex>
              </Flex>
              <Flex gap="1rem" flex="1" direction="column">
                <Flex>
                  <FileUploadInput label="Template" accept="application/pdf" onChange={setCertTemplateToUpload} width="18rem" />
                </Flex>
              </Flex>
            </Flex>
          </Flex>
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
