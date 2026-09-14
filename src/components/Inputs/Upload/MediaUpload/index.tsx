import React from 'react';
import { UploadOutlined } from '@ant-design/icons';
import { Button, Space, Upload, UploadFile } from 'antd';
import { create } from 'zustand';

import { IUploadInputProps, UploadInputHookType } from '../interfaces';

export const useMediaUploadInput = create<UploadInputHookType>((set) => ({
  fileList: [],
  clearFileList: () => set(() => ({ fileList: [] })),
  setFileList: (data: UploadFile<File>[]) => set(() => ({ fileList: data })),
}));

export const MediaUploadInput: React.FC<IUploadInputProps> = ({ label, accept, width, onChange }) => {
  const { setFileList, fileList } = useMediaUploadInput();

  return (
    <Space direction="vertical" size="large" style={{ width: width || '100%' }}>
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
