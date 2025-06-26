const STORAGE_KEYS = {
  OPERATOR_NAME: 'dncl_operator_name',
  OPERATOR_DATE: 'dncl_operator_date'
} as const

export interface StoredData {
  name: string
  date: string
}

export const storageUtils = {
  // Save operator data to localStorage
  saveOperatorData: (data: StoredData): void => {
    try {
      localStorage.setItem(STORAGE_KEYS.OPERATOR_NAME, data.name)
      localStorage.setItem(STORAGE_KEYS.OPERATOR_DATE, data.date)
    } catch (error) {
      console.error('Failed to save to localStorage:', error)
    }
  },

  // Load operator data from localStorage
  loadOperatorData: (): StoredData => {
    try {
      return {
        name: localStorage.getItem(STORAGE_KEYS.OPERATOR_NAME) || '',
        date: localStorage.getItem(STORAGE_KEYS.OPERATOR_DATE) || ''
      }
    } catch (error) {
      console.error('Failed to load from localStorage:', error)
      return { name: '', date: '' }
    }
  },

  // Clear operator data from localStorage
  clearOperatorData: (): void => {
    try {
      localStorage.removeItem(STORAGE_KEYS.OPERATOR_NAME)
      localStorage.removeItem(STORAGE_KEYS.OPERATOR_DATE)
    } catch (error) {
      console.error('Failed to clear localStorage:', error)
    }
  }
} 