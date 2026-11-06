import { Outlet } from 'react-router'

/**
 * Future login checks belong at this route boundary. For now every student
 * route is public: do not create sessions, redirect visitors, or gate the lab.
 */
export function StudentRouteBoundary() {
  return <Outlet />
}
