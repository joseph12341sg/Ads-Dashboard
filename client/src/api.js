// All calls now go to localStorage — no backend needed.
export {
  getEntries,
  getEntryByDate,
  createEntry,
  updateEntry,
  deleteEntry,
  getMonthlySummary,
  getWeeklySummary,
  getSettings,
  saveSetting
} from './storage'
