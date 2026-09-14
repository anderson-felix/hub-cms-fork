import { Flex, Text } from '@chakra-ui/react';
import { Select, SelectProps } from 'antd';
import { TiWarningOutline } from 'react-icons/ti';

interface ISelectInputProps extends SelectProps {
  label?: string;
  error?: string;
}

export const SelectInput: React.FC<ISelectInputProps> = ({ label, error, ...rest }) => {
  return (
    <Flex w="100%" direction="column">
      {label && (
        <Text color="gray500" mb="0.25rem" fontWeight="500" fontSize="13.5px">
          {label}
        </Text>
      )}
      <Select
        {...rest}
        showSearch
        filterOption={(input, option) => !!`${option?.label || ''}`.toLocaleLowerCase().includes(input.toLocaleLowerCase())}
        style={{ width: `100%`, ...(rest.style || {}), fontFamily: `'Inter' - sans-serif !important`, zIndex: 999999 }}
      />
      {error && (
        <Flex color="primary500" align="center" gap=".15rem">
          <TiWarningOutline fontSize="15px" />
          <Text fontSize="13px">{error}</Text>
        </Flex>
      )}
    </Flex>
  );
};
