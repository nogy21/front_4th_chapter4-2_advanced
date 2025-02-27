import {
  Box,
  Button,
  Flex,
  Grid,
  GridItem,
  Popover,
  PopoverArrow,
  PopoverBody,
  PopoverCloseButton,
  PopoverContent,
  PopoverTrigger,
  Text,
} from '@chakra-ui/react';
import { CellSize, DAY_LABELS, 분 } from './constants.ts';
import { Schedule } from './types.ts';
import { fill2, parseHnM } from './utils.ts';
import { useDraggable, useDndContext } from '@dnd-kit/core';
import { CSS } from '@dnd-kit/utilities';
import { Fragment, memo, useCallback, useMemo } from 'react';
import { useScheduleTableContext } from './ScheduleTableContext.tsx';

interface Props {
  tableId: string;
  isActive?: boolean;
  onScheduleTimeClick?: (tableId: string, timeInfo: { day: string; time: number }) => void;
  onDeleteButtonClick?: (tableId: string, timeInfo: { day: string; time: number }) => void;
}

const TIMES = [
  ...Array(18)
    .fill(0)
    .map((v, k) => v + k * 30 * 분)
    .map((v) => `${parseHnM(v)}~${parseHnM(v + 30 * 분)}`),

  ...Array(6)
    .fill(18 * 30 * 분)
    .map((v, k) => v + k * 55 * 분)
    .map((v) => `${parseHnM(v)}~${parseHnM(v + 50 * 분)}`),
] as const;

const ScheduleTableGrid = memo(
  ({
    onScheduleTimeClick,
  }: {
    onScheduleTimeClick?: (timeInfo: { day: string; time: number }) => void;
  }) => {
    return (
      <Grid
        templateColumns={`120px repeat(${DAY_LABELS.length}, ${CellSize.WIDTH}px)`}
        templateRows={`40px repeat(${TIMES.length}, ${CellSize.HEIGHT}px)`}
        bg="white"
        fontSize="sm"
        textAlign="center"
        outline="1px solid"
        outlineColor="gray.300"
      >
        <GridItem key="교시" borderColor="gray.300" bg="gray.100">
          <Flex justifyContent="center" alignItems="center" h="full" w="full">
            <Text fontWeight="bold">교시</Text>
          </Flex>
        </GridItem>
        {DAY_LABELS.map((day) => (
          <GridItem key={day} borderLeft="1px" borderColor="gray.300" bg="gray.100">
            <Flex justifyContent="center" alignItems="center" h="full">
              <Text fontWeight="bold">{day}</Text>
            </Flex>
          </GridItem>
        ))}
        {TIMES.map((time, timeIndex) => (
          <Fragment key={`시간-${timeIndex + 1}`}>
            <GridItem
              borderTop="1px solid"
              borderColor="gray.300"
              bg={timeIndex > 17 ? 'gray.200' : 'gray.100'}
            >
              <Flex justifyContent="center" alignItems="center" h="full">
                <Text fontSize="xs">
                  {fill2(timeIndex + 1)} ({time})
                </Text>
              </Flex>
            </GridItem>
            {DAY_LABELS.map((day) => (
              <GridItem
                key={`${day}-${timeIndex + 2}`}
                borderWidth="1px 0 0 1px"
                borderColor="gray.300"
                bg={timeIndex > 17 ? 'gray.100' : 'white'}
                cursor="pointer"
                _hover={{ bg: 'yellow.100' }}
                onClick={() => onScheduleTimeClick?.({ day, time: timeIndex + 1 })}
              />
            ))}
          </Fragment>
        ))}
      </Grid>
    );
  }
);

interface DraggableScheduleProps {
  id: string;
  data: Schedule;
  bg: string;
  onDeleteButtonClick: () => void;
}

const DraggableSchedule = memo(
  function DraggableSchedule({ id, data, bg, onDeleteButtonClick }: DraggableScheduleProps) {
    const { day, range, room, lecture } = data;
    const { attributes, setNodeRef, listeners, transform } = useDraggable({ id });
    const leftIndex = DAY_LABELS.indexOf(day as (typeof DAY_LABELS)[number]);
    const topIndex = range[0] - 1;
    const size = range.length;

    return (
      <Popover>
        <PopoverTrigger>
          <Box
            position="absolute"
            left={`${120 + CellSize.WIDTH * leftIndex + 1}px`}
            top={`${40 + (topIndex * CellSize.HEIGHT + 1)}px`}
            width={CellSize.WIDTH - 1 + 'px'}
            height={CellSize.HEIGHT * size - 1 + 'px'}
            bg={bg}
            p={1}
            boxSizing="border-box"
            cursor="pointer"
            ref={setNodeRef}
            transform={CSS.Translate.toString(transform)}
            {...listeners}
            {...attributes}
          >
            <Text fontSize="sm" fontWeight="bold">
              {lecture.title}
            </Text>
            <Text fontSize="xs">{room}</Text>
          </Box>
        </PopoverTrigger>
        <PopoverContent onClick={(event) => event.stopPropagation()}>
          <PopoverArrow />
          <PopoverCloseButton />
          <PopoverBody>
            <Text>강의를 삭제하시겠습니까?</Text>
            <Button colorScheme="red" size="xs" onClick={onDeleteButtonClick}>
              삭제
            </Button>
          </PopoverBody>
        </PopoverContent>
      </Popover>
    );
  },
  (prevProps, nextProps) => {
    return prevProps.id === nextProps.id && prevProps.data === nextProps.data;
  }
);

const ScheduleTable = memo(
  ({
    tableId,
    isActive: activeOutline = false,
    onScheduleTimeClick,
    onDeleteButtonClick,
  }: Props) => {
    const { schedules } = useScheduleTableContext();
    const { active } = useDndContext();
    const draggedId = active ? String(active.id) : null;

    const lectureColorMap = useMemo(() => {
      const lectures = [...new Set(schedules.map(({ lecture }) => lecture.id))];
      const colors = ['#fdd', '#ffd', '#dff', '#ddf', '#fdf', '#dfd'];
      return new Map(
        lectures.map((lectureId, index) => [lectureId, colors[index % colors.length]])
      );
    }, [schedules]);

    const getColor = useCallback(
      (lectureId: string): string => {
        return lectureColorMap.get(lectureId) || '#ddd';
      },
      [lectureColorMap]
    );

    const deleteButtonHandlers = useMemo(() => {
      return schedules.map(
        (schedule) => () =>
          onDeleteButtonClick?.(tableId, {
            day: schedule.day,
            time: schedule.range[0],
          })
      );
    }, [onDeleteButtonClick, schedules, tableId]);

    const renderedSchedules = useMemo(() => {
      return schedules.map((schedule, index) => {
        const scheduleId = `${tableId}:${index}`;

        return (
          <DraggableSchedule
            key={`${tableId}:${schedule.lecture.id}:${index}`}
            id={scheduleId}
            data={schedule}
            bg={getColor(schedule.lecture.id)}
            onDeleteButtonClick={deleteButtonHandlers[index]}
          />
        );
      });
    }, [schedules, getColor, deleteButtonHandlers, tableId, draggedId]);

    const handleScheduleTimeClick = useCallback(
      (timeInfo: { day: string; time: number }) => {
        onScheduleTimeClick?.(tableId, timeInfo);
      },
      [onScheduleTimeClick, tableId]
    );

    return (
      <Box
        position="relative"
        outline={activeOutline ? '5px dashed' : undefined}
        outlineColor="blue.300"
      >
        <ScheduleTableGrid onScheduleTimeClick={handleScheduleTimeClick} />
        {renderedSchedules}
      </Box>
    );
  }
);

export default ScheduleTable;
