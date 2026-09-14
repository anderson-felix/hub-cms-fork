import { UploadFile } from 'antd';

export interface IUploadInputProps {
  label?: string;
  accept?: string;
  width?: string;
  onChange?: (file: File | null) => void;
}

export type UploadInputHookType = { fileList: UploadFile<File>[]; setFileList: (data: UploadFile<File>[]) => void; clearFileList: () => void };
