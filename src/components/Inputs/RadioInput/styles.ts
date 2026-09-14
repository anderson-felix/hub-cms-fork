import styled from 'styled-components';

export const Container = styled.div`
  user-select: none;
  position: relative;

  transition: color 0.5s;
`;

interface IHorizontalProps {
  isHorizontal?: boolean;
}

export const OptionsWrapper = styled.div<IHorizontalProps>`
  display: flex;
  align-items: ${(props) => (props.isHorizontal ? 'center' : 'flex-start')};
  flex-direction: ${(props) => (props.isHorizontal ? 'row' : 'column')};
  white-space: nowrap;
  & > * {
    display: inline-block;
  }

  & > :nth-child(n + 2) {
    margin: ${(props) => (props.isHorizontal ? '0 0 0 1.25rem' : '0')};
  }
`;

export const Input = styled.input`
  margin-right: 0.35rem;
  max-width: 3rem;
  color: #4d565c;
`;

export const Label = styled.label<IHorizontalProps>`
  font-size: 14px;
  color: #4d565c;
  cursor: pointer;
`;

export const Error = styled.div<IHorizontalProps>`
  color: #ff4d4d;
  display: flex;
  align-items: center;
  font-size: 14px;
  bottom: 0;

  #icon {
    margin-right: 0.25rem;
  }
`;
