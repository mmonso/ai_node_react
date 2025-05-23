import React from 'react';
import styled from 'styled-components';
import Layout from '../components/Layout';

const HomePage: React.FC = () => {
  return (
    <Layout>
      <HomeContainer>
        <WelcomeCard>
          <WelcomeTitle>Olá, como posso ajudar?</WelcomeTitle>
        </WelcomeCard>
      </HomeContainer>
    </Layout>
  );
};

const HomeContainer = styled.div`
  display: flex;
  align-items: center;
  justify-content: center;
  height: 100%;
  padding: 2rem;
`;

const WelcomeCard = styled.div`
  max-width: 600px;
  padding: 3rem;
  text-align: center;
`;

const WelcomeTitle = styled.h1`
  margin-bottom: 2.5rem;
  font-size: 2rem;
  color: var(--primary-text);
  font-weight: 600;
`;

export default HomePage;