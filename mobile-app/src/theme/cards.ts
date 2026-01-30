import { ViewStyle } from 'react-native';

export const cardStyles = {
  // Standard card - Glucose, Symptoms, Cycle
  standard: {
    backgroundColor: 'rgba(255,255,255,0.95)',
    borderRadius: 20,
    padding: 20,
    borderWidth: 1,
    borderColor: 'rgba(212,214,212,0.25)',
    shadowColor: '#000',
    shadowOffset: { width: 0, height: 6 },
    shadowOpacity: 0.06,
    shadowRadius: 12,
    elevation: 3,
  } as ViewStyle,

  // Coach card - Gold tint
  accent: {
    backgroundColor: 'rgba(184,164,95,0.06)',
    borderRadius: 20,
    padding: 20,
    borderWidth: 1,
    borderColor: 'rgba(184,164,95,0.15)',
    shadowColor: '#000',
    shadowOffset: { width: 0, height: 6 },
    shadowOpacity: 0.06,
    shadowRadius: 12,
    elevation: 3,
  } as ViewStyle,

  // Hairline divider
  divider: {
    height: 1,
    backgroundColor: 'rgba(212,214,212,0.3)',
    marginVertical: 20,
  } as ViewStyle,
};