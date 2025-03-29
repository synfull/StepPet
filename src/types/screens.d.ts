declare module '../screens/*' {
  import { NativeStackScreenProps } from '@react-navigation/native-stack';
  import { RootStackParamList } from './navigationTypes';
  
  const Screen: React.FC<NativeStackScreenProps<RootStackParamList, keyof RootStackParamList>>;
  export default Screen;
} 