import { Container, Text, Group } from '@mantine/core';

const Footer = () => {
  return (
    <div style={{ backgroundColor: 'white', color: '#475569', padding: '20px 0', borderTop: '1px solid #e2e8f0' }}>
      <Container size="xl">
        <Group justify="space-between" align="center">
          <Text size="sm" c="dimmed" style={{ opacity: 0.8, fontWeight: 500 }}>
            &copy; {new Date().getFullYear()} Sol del Amanecer SRL
          </Text>
          <Text size="xs" c="dimmed" style={{ opacity: 0.6 }}>
            Excelencia en Logística & Distribución
          </Text>
        </Group>
      </Container>
    </div>
  );
};

export default Footer;
