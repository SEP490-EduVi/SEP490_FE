import { createContext, useContext } from 'react';

/**
 * ColumnStretchContext
 * When true, image blocks inside a single-child layout column
 * should fill the full column height instead of using aspect-video.
 */
export const ColumnStretchContext = createContext(false);
export const useColumnStretch = () => useContext(ColumnStretchContext);
