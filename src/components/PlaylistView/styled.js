import styled from 'styled-components';

export const Wrapper = styled.div`
  display: flex;
  flex-direction: row;
  color: white;

  & h2 {
    font-size: 26px;
  }

  & p {
    color: rgba(255, 255, 255, 0.5);
    font-size: 15px;
    font-weight: 200;
    padding-bottom: 10px;
  }

  @media (max-width: 1200px) {
    display: flex;
    flex-direction: column;
    min-width: 515px;
    width: 100%;
  }
`;