import {
  Button,
  Center,
  Flex,
  Input,
  Popover,
  PopoverArrow,
  PopoverBody,
  PopoverCloseButton,
  PopoverContent,
  PopoverHeader,
  PopoverTrigger,
  SimpleGrid,
  Text,
  Tooltip,
} from '@chakra-ui/react';
import React, { useState } from 'react';
import { IoMdClose } from 'react-icons/io';
import { IColorPickerProps } from './interfaces';
import { isColorLight } from '@/_base/utils/isColorLight';

const INITIAL_COLOR = '#ffffff';
const DEFAULT_COLORS = ['', '#ffffff', '#000000', '#e53e3e', '#38a169', '#3182ce', '#2a4365', '#dd6b20', '#805ad5', '#d53f8c', '#f8bb3c', '#20f480'];

export const ColorPicker: React.FC<IColorPickerProps> = ({
  onChange,
  label,
  hoverLabel,
  color = INITIAL_COLOR,
  colors = DEFAULT_COLORS,
  wrapText = false,
  disableEntry = false,
  disableColorLabel = false,
}) => {
  const [selectedColor, setSelectedColor] = useState(color);

  const handleChangeColor = (hex: string) => {
    setSelectedColor(hex);
    onChange(hex);
  };

  return (
    <Flex
      direction="column"
      gap={1}
      align="center"
      onClick={(e) => {
        e.stopPropagation();
      }}
    >
      {label && (
        <Text fontSize="13px" color="text.gray" textAlign="center" whiteSpace={wrapText ? 'normal' : 'nowrap'}>
          {label}
        </Text>
      )}
      <Flex h="fit-content" w="fit-content">
        <Popover variant="picker">
          <PopoverTrigger>
            <Flex align="center" justify="center" gap="0.5rem">
              <Tooltip label={hoverLabel}>
                <Button
                  aria-label={selectedColor}
                  background={selectedColor}
                  height="2rem"
                  width="2rem"
                  padding={0}
                  minWidth="unset"
                  border={isColorLight(selectedColor) || !selectedColor ? '1px solid #d3d3d3' : undefined}
                  borderRadius={3}
                >
                  {selectedColor ? '' : <IoMdClose fontSize="1.5rem" color="#db3f3f" />}
                </Button>
              </Tooltip>
            </Flex>
          </PopoverTrigger>
          <PopoverContent width="190px">
            <PopoverArrow bg={selectedColor || '#000'} />
            <PopoverCloseButton color="white" />
            <PopoverHeader height="100px" backgroundColor={selectedColor || '#fff'} borderTopLeftRadius={5} borderTopRightRadius={5} color="white">
              {!disableColorLabel && (
                <Center height="100%" color={!selectedColor || isColorLight(selectedColor) ? '#4d4f5c' : '#fff'}>
                  {selectedColor || 'Empty'}
                </Center>
              )}
            </PopoverHeader>
            <PopoverBody>
              <SimpleGrid columns={6} spacing={2}>
                {colors.map((c) => (
                  <Button
                    key={c}
                    aria-label={c}
                    background={c}
                    height="22px"
                    width="22px"
                    padding={0}
                    minWidth="unset"
                    border={isColorLight(c) || !c ? '1px solid #d3d3d3' : undefined}
                    borderRadius={3}
                    _hover={{ background: c }}
                    onClick={(e) => {
                      e.stopPropagation();
                      handleChangeColor(c);
                    }}
                  >
                    {c ? '' : <IoMdClose color="#db3f3f" />}
                  </Button>
                ))}
              </SimpleGrid>
              {!disableEntry && (
                <Input
                  borderRadius={3}
                  marginTop={3}
                  size="sm"
                  value={selectedColor || 'Empty'}
                  onChange={(e) => {
                    handleChangeColor(e.target.value);
                  }}
                />
              )}
            </PopoverBody>
          </PopoverContent>
        </Popover>
      </Flex>
    </Flex>
  );
};
