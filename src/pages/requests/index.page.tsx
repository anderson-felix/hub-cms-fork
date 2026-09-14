import React, { Key, useEffect, useRef, useState } from 'react';
import { GetServerSideProps } from 'next';
import { Dropdown, Space, Table, Badge, Descriptions, Input, Button, InputRef } from 'antd';
import { SearchOutlined } from '@ant-design/icons';
import { IoOpen } from 'react-icons/io5';
import { PresetStatusColorType } from 'antd/es/_util/colors';
import type { ColumnType, ColumnsType } from 'antd/es/table';

import { FilterConfirmProps } from 'antd/es/table/interface';
import Highlighter from 'react-highlight-words';
import { Container, Content, ModalContent, ShowAction } from './styles';
import { formatReadableId } from '@/_base/utils';
import { useToast } from '@chakra-ui/react';
import { useAsyncCallback } from '@/_base/hooks';
import { SmallModal } from '@/components/Modal/Small';
import { GenericButton } from '@/components/Buttons/Generic';

interface ISchool {
  id: string;
  readable_id: number;
  user_id: string;
  amount: string;
  status: string;
  items: { id: string; name: string }[];
  updated_at: string;
  user: { id: string; name: string };
}

const generateFakeSchool = (id: number): ISchool => ({
  id: `school_${id}`,
  readable_id: id,
  user_id: `user_${id}`,
  amount: `${(Math.random() * 100).toFixed(2)}`,
  status:
    Math.random() < 0.2
      ? 'authorized'
      : Math.random() < 0.4
      ? 'canceled'
      : Math.random() < 0.6
      ? 'finished'
      : Math.random() < 0.8
      ? 'confirmed'
      : `waiting_authorization`,
  items: Array.from({ length: Math.floor(Math.random() * 5) + 1 }, (_, index) => ({ id: `item_${index + 1}`, name: `item_${index + 1}` })),
  updated_at: new Date().toISOString(),
  user: { id: `user_${id}`, name: `escola_${id}` },
});

interface DataType {
  key: string;
  readable_id: string;
  group_name: string;
  status: string;
  amount: string;
  school_name: string;
}
type DataIndex = keyof DataType;

interface IProps {
  schools: ISchool[];
}

type StatusDisplay = {
  label: string;
  badge: PresetStatusColorType;
};

type StatusModalProps = { open: boolean; status?: string };

const statusBadgeMapper: Record<string, StatusDisplay> = {
  authorized: { label: 'Autorizado (Em preparação)', badge: 'processing' },
  canceled: { label: 'Cancelado', badge: 'error' },
  finished: { label: 'Finalizado', badge: 'success' },
  confirmed: { label: 'Confirmado', badge: 'success' },
  waiting_authorization: {
    label: 'Aguardando autorização',
    badge: 'processing',
  },
  waiting_confirmation: {
    label: 'Aguardando confirmação do grupo',
    badge: 'warning',
  },
  ...({} as any),
};

const formatTableData = (school: ISchool): DataType => ({
  key: school.id,
  readable_id: formatReadableId(school.readable_id),
  amount: school.amount,
  group_name: school.user.name,
  status: school.status,
  school_name: school.user.name,
});

const Request: React.FC<IProps> = ({ schools }) => {
  const [targetSchool, setTargetSchool] = useState<ISchool | null>(null);
  const [tableData, setTableData] = useState<DataType[]>([]);

  const [statusModal, setStatusModal] = useState<StatusModalProps>({
    open: false,
  });
  const [selectedRows, setSelectedRows] = useState<string[]>([]);

  const [searchText, setSearchText] = useState('');
  const [searchedColumn, setSearchedColumn] = useState('');
  const searchInput = useRef<InputRef>(null);

  const toast = useToast();

  const handleSearch = (selectedKeys: string[], confirm: (param?: FilterConfirmProps) => void, dataIndex: DataIndex) => {
    confirm();
    setSearchText(selectedKeys[0]);
    setSearchedColumn(dataIndex);
  };

  const handleReset = (clearFilters: () => void) => {
    clearFilters();
    setSearchText('');
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

  useEffect(() => {
    setTableData(schools.map(formatTableData));
  }, [schools]);

  const handleOpenSchoolModal = (readable_id: number) => {
    const school = schools.find((e) => e.readable_id === readable_id);

    if (school) setTargetSchool(school);
  };

  const handleConfirmSchoolModal = useAsyncCallback(async () => {
    if (!targetSchool) return;

    setTableData((e) => e.map((data) => (data.readable_id === formatReadableId(targetSchool?.readable_id) ? formatTableData(targetSchool) : data)));
    setTargetSchool(null);

    toast({ description: 'Pedido atualizado!', status: 'success' });
  }, [targetSchool]);

  const handleConfirmStatusModal = useAsyncCallback(async () => {
    if (!statusModal.status) return;

    setStatusModal({ open: false });
    toast({
      description: selectedRows.length === 1 ? '1 pedido atualizado!' : `${selectedRows.length} pedidos atualizados!`,
      status: 'success',
    });
    setSelectedRows([]);
  }, [statusModal]);

  const columns: ColumnsType<DataType> = [
    {
      title: 'ID',
      dataIndex: 'readable_id',
      key: 'readable_id',
      ...getColumnSearchProps('readable_id'),
    },
    {
      title: 'Escola',
      dataIndex: 'school_name',
      key: 'school_name',
      ...getColumnSearchProps('school_name'),
    },
    {
      title: 'Grupo',
      dataIndex: 'group_name',
      key: 'group_name',
      ...getColumnSearchProps('group_name'),
    },
    {
      title: 'Status',
      key: 'status',
      dataIndex: 'status',
      render: (_, { status }) => <Badge status={`${statusBadgeMapper[status].badge}`} text={`${statusBadgeMapper[status].label}`} />,
    },
    {
      title: 'Valor total',
      dataIndex: 'amount',
      key: 'amount',
    },
    {
      title: 'Visualizar',
      key: 'products',
      render: (_, { readable_id }) => (
        <ShowAction onClick={() => handleOpenSchoolModal(Number(readable_id))}>
          <IoOpen />
        </ShowAction>
      ),
    },
  ];

  return (
    <Container>
      <GenericButton label="Atualizar" btntype="outline-white" onClick={() => setStatusModal({ open: true })} />

      <Content>
        <Table
          columns={columns}
          dataSource={tableData}
          rowSelection={{
            onChange: (data: Key[]) => {
              setSelectedRows(data.map((e) => e.toString()));
            },
            selectedRowKeys: selectedRows,
          }}
          size="middle"
        />
      </Content>
      <SmallModal
        show={!!targetSchool}
        title={targetSchool ? `Pedido ${formatReadableId(targetSchool.readable_id)}` : ''}
        onConfirm={handleConfirmSchoolModal}
        onCancel={() => setTargetSchool(null)}
        okText="Salvar"
        cancelText="Cancelar"
      >
        <ModalContent>
          <Descriptions bordered column={1} size="middle">
            <Descriptions.Item style={{ padding: `0 0.5rem` }} label="Escola">
              {targetSchool?.user.name}
            </Descriptions.Item>

            <Descriptions.Item style={{ padding: `0 0.5rem` }} label="Turma">
              {targetSchool?.user.name}
            </Descriptions.Item>

            <Descriptions.Item style={{ padding: `0 0.5rem` }} label="Grupo">
              {targetSchool?.user.name}
            </Descriptions.Item>

            <Descriptions.Item style={{ padding: `0 0.5rem` }} label="Usuário">
              {targetSchool?.user.name}
            </Descriptions.Item>

            <Descriptions.Item style={{ padding: `0 0.5rem` }} label="Status  >" labelStyle={{ color: '#2568e4' }}>
              <Dropdown
                menu={{
                  items: Object.keys(statusBadgeMapper)
                    .slice(0, 3)
                    .map((status: string) => ({
                      onClick: ({ key }) => setTargetSchool((e) => ({ ...(e || ({} as any)), status: key })),
                      key: status,
                      label: statusBadgeMapper[status].label,
                      icon: <Badge status={`${statusBadgeMapper[status].badge || 'default'}`} />,
                    })),
                }}
              >
                <Badge
                  status={statusBadgeMapper[targetSchool?.status || ``]?.badge || 'default'}
                  text={statusBadgeMapper[targetSchool?.status || ``]?.label}
                  style={{ cursor: 'pointer' }}
                />
              </Dropdown>
            </Descriptions.Item>

            <Descriptions.Item style={{ padding: `0 0.5rem` }} label="Valor do pedido">
              R${targetSchool?.amount}
            </Descriptions.Item>
          </Descriptions>
          <Descriptions bordered column={1} size="small">
            <Descriptions.Item
              label="Produto"
              labelStyle={{ fontWeight: 600, fontStyle: 'italic' }}
              contentStyle={{ fontWeight: 600, fontStyle: 'italic' }}
            >
              Quantidade
            </Descriptions.Item>
            {targetSchool?.items.map((item) => (
              <Descriptions.Item key={item.id} label={`${item.name}`}>
                {item.id}
              </Descriptions.Item>
            ))}
          </Descriptions>
        </ModalContent>
      </SmallModal>
      <SmallModal
        show={statusModal.open}
        title={`Atualizar ${selectedRows.length === 1 ? '1 pedido' : selectedRows.length.toString().concat(' pedidos')}`}
        onConfirm={handleConfirmStatusModal}
        onCancel={() => setStatusModal({ open: false })}
        okText="Confirmar"
        cancelText="Cancelar"
      >
        <ModalContent>
          <Descriptions bordered column={1} size="default">
            <Descriptions.Item label="Status" labelStyle={{ color: '#2568e4' }} style={{ width: 'fit-content' }}>
              <Dropdown
                menu={{
                  items: Object.keys(statusBadgeMapper)
                    .slice(0, 3)
                    .map((status: string) => ({
                      onClick: ({ key }) =>
                        setStatusModal((e) => ({
                          ...e,
                          status: key,
                        })),
                      key: status,
                      label: statusBadgeMapper[status].label,
                      icon: <Badge status={`${statusBadgeMapper[status].badge}`} />,
                    })),
                }}
              >
                <Badge
                  status={statusBadgeMapper[statusModal?.status || 'authorized'].badge}
                  text={statusBadgeMapper[statusModal?.status || 'authorized'].label}
                  style={{ cursor: 'pointer' }}
                />
              </Dropdown>
            </Descriptions.Item>
          </Descriptions>
        </ModalContent>
      </SmallModal>
    </Container>
  );
};

export default Request;

export const getServerSideProps: GetServerSideProps = async () => {
  try {
    const schools = Array.from({ length: 30 }, (_, i) => generateFakeSchool(i + 1));

    return {
      props: {
        admin: {},
        schools,
        selectedPage: 'requests',
        pageTitle: 'Pedidos',
      },
    };
  } catch (err) {
    return {
      redirect: { destination: '/requests', permanent: false },
    };
  }
};
