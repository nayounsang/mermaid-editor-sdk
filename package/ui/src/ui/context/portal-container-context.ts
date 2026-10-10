import { createContext, useContext } from 'react';
import type { RefObject } from 'react';

export type PortalContainer = HTMLElement | ShadowRoot | RefObject<HTMLElement | ShadowRoot | null> | null;

const PortalContainerContext = createContext<PortalContainer | undefined>(undefined);

export const PortalContainerProvider = PortalContainerContext.Provider;

export function usePortalContainer(): PortalContainer | undefined {
  return useContext(PortalContainerContext);
}
