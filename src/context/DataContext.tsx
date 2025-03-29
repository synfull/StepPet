import { createContext } from 'react';
import { PetData } from '../types/petTypes';

type DataContextType = {
  petData: PetData | null;
  setPetData: (data: PetData | null) => void;
};

export const DataContext = createContext<DataContextType>({
  petData: null,
  setPetData: () => {},
}); 