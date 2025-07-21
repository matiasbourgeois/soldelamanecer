// styles/modalesStyles.ts

import { StyleSheet } from 'react-native';

export const modalesStyles = StyleSheet.create({
  modalOverlay: {
    flex: 1,
    backgroundColor: 'rgba(0,0,0,0.5)',
    justifyContent: 'center',
    alignItems: 'center',
  },
  modalContainer: {
    backgroundColor: '#fff',
    borderRadius: 20,
    padding: 20,
    width: '90%',
  },
  modalTitle: {
    fontSize: 18,
    fontWeight: '700',
    color: '#212529', // negro moderno
    marginBottom: 12,
    textAlign: 'center',
    backgroundColor: '#f8f9fa',
    paddingVertical: 10,
    borderRadius: 8,
  },
  
  modalText: {
    fontSize: 14,
    marginBottom: 6,
    fontWeight: '500',
    color: '#6c757d',
  },
 
  btnConfirmar: {
    backgroundColor: '#28a745', // verde profesional
    padding: 12,
    borderRadius: 30,
    alignItems: 'center',
    marginVertical: 6,
  },
  
  btnSecundario: {
    backgroundColor: '#e4606d', // gris claro
    padding: 12,
    borderRadius: 30,
    alignItems: 'center',
    marginVertical: 6,
  },
  
  btnCancelar: {
    backgroundColor: '#495057',
    padding: 12,
    borderRadius: 30,
    alignItems: 'center',
    marginTop: 12,
  },
  
  buttonText: {
    color: '#ffffff',
    fontWeight: '600',
  },
  
  input: {
    borderWidth: 1,
    borderColor: '#ced4da',
    borderRadius: 8,
    padding: 10,
    marginBottom: 10,
    fontSize: 16,
    backgroundColor: '#fff',
    color: '#212529',
  },
});
