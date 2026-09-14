import styled from 'styled-components';

export const Container = styled.div`
  display: flex;
  padding: 1rem;
  flex-direction: column;
  height: 100%;
  flex: 1;
  overflow: hidden;
  padding: 1rem;
  gap: 1rem;
`;

export const Content = styled.div`
  display: flex;
  flex-direction: column;
  height: 100%;
  overflow: hidden auto;

  td {
    background-color: #474747 !important;
    color: #ffffff !important;
  }

  th {
    background-color: #474747 !important;
    color: #ffffff !important;
    * {
      color: #ffffff !important;
    }
  }
  ul {
    margin: 0 !important;
    padding: 1rem 0;
    border-radius: 0 0 6px 6px;
    background-color: #474747 !important;
    color: #ffffff !important;
    a {
      color: #ffffff !important;
      background-color: #272c36;
      border-radius: 6px;
    }
  }
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
  width: 100%;
  overflow-y: auto;
  row-gap: 1rem;

  * {
    z-index: 99999 !important;
  }
`;
