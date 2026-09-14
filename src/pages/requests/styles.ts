import styled from 'styled-components';

export const Container = styled.div`
  display: flex;
  padding: 1rem;
  flex-direction: column;
  height: 100%;
  overflow: hidden;
  padding: 1rem;
  gap: 1rem;
`;

export const Content = styled.div`
  display: flex;
  flex-direction: column;
  height: 100%;
  overflow: hidden auto;
`;

export const ShowAction = styled.div`
  display: flex;
  justify-content: center;
  color: ${(props) => props.theme.primary300};
  font-size: 1.5rem;
  cursor: pointer;
  transition: all 0.15s;

  :hover {
    filter: brightness(0.8);
  }
`;

export const ModalContent = styled.div`
  display: flex;
  flex-direction: column;
  height: 100%;
  overflow-y: auto;
  row-gap: 1rem;
`;
