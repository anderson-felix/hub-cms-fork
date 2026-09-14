import { Flex } from '@chakra-ui/react';
import { ITabSwitchProps } from './interfaces';

export const TabSwitch: React.FC<ITabSwitchProps> = ({ tabs, onSwitch, currentTabColor = 'primary700' }) => {
  return (
    <Flex
      minH="52px"
      maxH="52px"
      border="1px"
      borderColor="gray300"
      align="center"
      padding="0.65rem"
      w="fit-content"
      borderRadius="lg"
      boxShadow="sm"
      gap="0.65rem"
      userSelect="none"
    >
      {tabs.map((tab) => (
        <Flex
          key={tab.key}
          bg={tab.isSelected ? currentTabColor : 'transparent'}
          color="white"
          padding="0.2rem 1rem"
          borderRadius="lg"
          fontWeight="500"
          cursor="pointer"
          onClick={() => onSwitch(tab.key)}
          _hover={!tab.isSelected ? { bg: 'gray100' } : undefined}
        >
          {tab.label}
        </Flex>
      ))}
    </Flex>
  );
};
