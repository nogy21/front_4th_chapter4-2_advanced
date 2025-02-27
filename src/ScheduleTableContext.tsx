import { createContext, PropsWithChildren, useContext, useMemo } from 'react';
import { Schedule } from './types';

interface ScheduleTableContextType {
  schedules: Schedule[];
}

const ScheduleTableContext = createContext<ScheduleTableContextType | undefined>(undefined);

export const useScheduleTableContext = () => {
  const context = useContext(ScheduleTableContext);
  if (!context) {
    throw new Error('useScheduleTableContext must be used within a ScheduleTableProvider');
  }
  return context;
};

export const ScheduleTableProvider = ({
  children,
  schedules,
}: PropsWithChildren<ScheduleTableContextType>) => {
  const memoizedSchedules = useMemo(() => schedules, [schedules]);
  return (
    <ScheduleTableContext.Provider value={{ schedules: memoizedSchedules }}>
      {children}
    </ScheduleTableContext.Provider>
  );
};
