"use client"
import { createContext, useContext, type ReactNode } from "react"

// "Today" (an IST date like 2026-11-10) is decided on the server and handed down, so server and browser
// agree and nothing needs the browser clock during rendering (which would cause hydration mismatches).
const TodayContext = createContext("1970-01-01")
export function TodayProvider({ today, children }: { today: string; children: ReactNode }) { return <TodayContext value={today}>{children}</TodayContext> }
export const useToday = () => useContext(TodayContext)
