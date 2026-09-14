import { InputProps } from '@chakra-ui/react';
import { HTMLAttributes, ReactNode } from 'react';

export interface IInputProps extends InputProps {
  onInputChange?: (value: string) => void;
  value?: string;
  placeholder?: string;
  label?: string;
  error?: string;
  leftElement?: ReactNode;
  rightElement?: ReactNode;
}

export interface ICodeInputProps {
  onFill?: (value: string) => void;
  onChange?: (value: string) => void;
  codeLength?: number;
  error?: string;
}

export interface IRadioInputProps extends HTMLAttributes<HTMLElement> {
  title: string;
  name?: string;
  initialValue?: string;
  options: OptionType[];
  isHorizontal?: boolean;
  checkedValue?: string;
  onInputChange?: (value: string) => void;
  error?: string;
  disabled?: boolean;
}

export type OptionType = { value: string; label: string };
