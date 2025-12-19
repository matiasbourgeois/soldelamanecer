import { Container, Text, Group } from '@mantine/core';

const Footer = () => {
  return (
    <div style={{ backgroundColor: '#212529', color: 'white', padding: '15px 0', marginTop: 'auto' }}>
      <Container size="lg">
        <Group justify="center" align="center">
          <Text size="sm" c="white" style={{ opacity: 0.8 }}>
            &copy; {new Date().getFullYear()} Sol del Amanecer SRL
          </Text>
        </Group>
      </Container>
    </div>
  );
};

export default Footer;
