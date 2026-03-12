import { format, formatDistance, formatRelative, isToday, isYesterday } from 'date-fns'
import { fr } from 'date-fns/locale'

export const formatDate = (date, formatStr = 'PPP') => {
  if (!date) return '-'
  return format(new Date(date), formatStr, { locale: fr })
}

export const formatDateTime = (date) => {
  if (!date) return '-'
  return format(new Date(date), 'PPP p', { locale: fr })
}

export const formatTime = (date) => {
  if (!date) return '-'
  return format(new Date(date), 'p', { locale: fr })
}

export const formatRelativeTime = (date) => {
  if (!date) return '-'
  return formatDistance(new Date(date), new Date(), { addSuffix: true, locale: fr })
}

export const formatShortDate = (date) => {
  if (!date) return '-'
  if (isToday(new Date(date))) {
    return `Today at ${format(new Date(date), 'p')}`
  }
  if (isYesterday(new Date(date))) {
    return `Yesterday at ${format(new Date(date), 'p')}`
  }
  return format(new Date(date), 'MMM d, yyyy')
}