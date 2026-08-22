import { AdProvider, AdProviderName } from '../types';
import { MockAdProvider } from './MockAdProvider';
import { TelegramAdProvider } from './TelegramAdProvider';

export const createAdProvider = (provider: AdProviderName): AdProvider => {
  switch (provider) {
    case 'telegram':
      return new TelegramAdProvider();
    case 'mock':
    default:
      return new MockAdProvider();
  }
};
