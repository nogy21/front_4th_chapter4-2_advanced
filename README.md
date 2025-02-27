# 리액트 프로젝트 성능 개선

- url: https://front-4th-chapter4-2-advanced-sooty.vercel.app/

## 개요

- 리액트 프로젝트 성능 개선 과제입니다.
- 기존 문제점과 개선점을 정리하고, 개선 과정을 기록합니다.

## 기존 문제점

1. 수업 검색 모달 내 검색 결과를 보여주는 리스트에서 페이지네이션이 느립니다.
2. 똑같은 API를 계속 호출합니다.
3. 시간표에서 드래그/드롭으로 과목에 해당하는 블럭을 옮길 수 있지만 무척 느립니다.
4. 시간표가 많아질수록 렌더링이 기하급수적으로 느려집니다.

## 목표

> profiler를 통해 리액트 애플리케이션의 렌더링 분석

- 개선점
  - 페이지네이션 시 발생하는 렌더링 + 불필요한 연산 최소화
  - 드래그/드롭 시점에 발생하는 렌더링 + 불필요한 연산 최소화

## 1. SearchDialog.tsx 개선

### 1) Promise.all 사용 최적화

- 기존에 잘못된 await 사용으로 병렬 요청이 의도대로 동작하지 않아 불필요한 await 키워드 제거

```tsx
const fetchMajors = () => axios.get<Lecture[]>('/schedules-majors.json');
const fetchLiberalArts = () => axios.get<Lecture[]>('/schedules-majors.json');

const fetchAllLectures = async () =>
  await Promise.all([
    (console.log('API Call 1', performance.now()), fetchMajors()),
    (console.log('API Call 2', performance.now()), fetchLiberalArts()),
    (console.log('API Call 3', performance.now()), fetchMajors()),
    (console.log('API Call 4', performance.now()), fetchLiberalArts()),
    (console.log('API Call 5', performance.now()), fetchMajors()),
    (console.log('API Call 6', performance.now()), fetchLiberalArts()),
  ]);
```

### 2) API 호출 캐시 최적화

- 클로저를 활용하여 lecture data를 캐싱 처리 -> 불필요한 API 호출 회수 감소

```tsx
const fetchAllLectures = (() => {
  let cache: AxiosResponse<Lecture[]>[] = [];

  return async () => {
    if (cache && cache.length > 0) {
      return cache;
    }

    cache = await Promise.all([
      (console.log('API Call 1', performance.now()), fetchMajors()),
      (console.log('API Call 2', performance.now()), fetchLiberalArts()),
      (console.log('API Call 3', performance.now()), fetchMajors()),
      (console.log('API Call 4', performance.now()), fetchLiberalArts()),
      (console.log('API Call 5', performance.now()), fetchMajors()),
      (console.log('API Call 6', performance.now()), fetchLiberalArts()),
    ]);

    return cache;
  };
})();
```

### 3) 불필요한 연산 방지

- useMemo, useCallback 활용하여 불필요한 재렌더링 방지
- 필터링 로직을 별도의 상태로 관리하여 성능 최적화
- memo를 사용하여 컴포넌트 리렌더링 조건 세밀하게 제어
- 로딩 상태 추가 및 필터링 로직 성능 개선

[커밋 링크](https://github.com/nogy21/front_4th_chapter4-2_advanced/commit/89413cf66c27609e285f5cb2e85d1d07aa64fe50)

## 2. DnD 시스템 개선

### 1) 드래그시 렌더링 최적화

- ScheduleTableContext를 생성하여 시간표 데이터를 전역 상태로 관리하고, 불필요한 props 전달을 줄임
- Tables 컴포넌트에서 active 상태를 관리하도록 변경하여, 드래그 시 개별 ScheduleTable의 불필요한 재렌더링 방지
- ScheduleTableGrid 컴포넌트를 분리하여 드래그 중 불필요한 그리드 재렌더링 방지
- DraggableSchedule을 React.memo로 감싸 불필요한 재렌더링을 방지
- useMemo와 useCallback을 활용하여 핸들러 및 계산된 값들을 캐싱, 불필요한 함수 재생성 최소화

[커밋 링크](https://github.com/nogy21/front_4th_chapter4-2_advanced/commit/5828d90064b445cbbdd1f08772756c6945f6b7be)

### 2) Drop을 했을 때 렌더링 최적화

- setSchedulesMap에서 기존 schedulesMap을 직접 복사하여 수정하는 방식에서, prev 상태를 활용한 함수형 업데이트 방식으로 변경하여 불필요한 렌더링 최소화
- 불필요한 map 순회 제거, 직접 인덱스로 스케줄 업데이트

[커밋 링크](https://github.com/nogy21/front_4th_chapter4-2_advanced/commit/2470919bc045ca111595fe5f85ff981ee5105c48)
