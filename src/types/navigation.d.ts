declare module '../navigation/TabNavigator' {
  import { FC } from 'react';
  
  const TabNavigator: FC;
  export default TabNavigator;
}

declare module '../navigation/*' {
  import { FC } from 'react';
  
  const Navigator: FC;
  export default Navigator;
} 