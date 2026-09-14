import React from 'react';
import { UploadOutlined } from '@ant-design/icons';
import { Button, Space, Upload, UploadFile } from 'antd';
import { create } from 'zustand';

interface IUploadInputProps {
  label?: string;
  accept?: string;
  onChange?: (file: File | null) => void;
}

type UploadInputHookType = { fileList: UploadFile<File>[]; setFileList: (data: UploadFile<File>[]) => void; clearFileList: () => void };

export const useVideoUploadInput = create<UploadInputHookType>((set) => ({
  fileList: [],
  clearFileList: () => set(() => ({ fileList: [] })),
  setFileList: (data: UploadFile<File>[]) => set(() => ({ fileList: data })),
}));

export const VideoUploadInput: React.FC<IUploadInputProps> = ({ label, accept, onChange }) => {
  const { setFileList, fileList } = useVideoUploadInput();

  return (
    <Space direction="vertical" style={{ width: '100%' }} size="large">
      <Upload
        listType="picture"
        maxCount={1}
        accept={accept}
        onChange={({ fileList }) => {
          if (onChange) onChange(fileList[0]?.originFileObj || null);
          setFileList(fileList);
        }}
        fileList={fileList}
      >
        <Button icon={<UploadOutlined />}>{label || `Upload`}</Button>
      </Upload>
    </Space>
  );
};
