/** Mock users for the admin table (no backend). */
export type MockAdminUser = {
  id: string
  name: string
  email: string
  club: string
  totalActivities: number
  officialActivities: number
}

/** Mock official activities for the admin table. */
export type MockOfficialActivity = {
  id: string
  userName: string
  category: string
  routeOrLocation: string
  /** ISO YYYY-MM-DD */
  date: string
  status: 'official'
}
