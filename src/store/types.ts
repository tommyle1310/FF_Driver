// store/types.ts
import { useDispatch as useReduxDispatch, useSelector as useReduxSelector, TypedUseSelectorHook } from 'react-redux';
import { AppDispatch, RootState } from './store'; // Ensure this path is correct

export const useDispatch = () => useReduxDispatch<AppDispatch>(); // Correct custom useDispatch hook
export const useSelector: TypedUseSelectorHook<RootState> = useReduxSelector; // Correct custom useSelector hook
