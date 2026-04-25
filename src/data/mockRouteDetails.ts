import type { RouteDetailModel } from '../types/routeDetail.ts'
import { APP_HOME_ASSETS } from '../constants/appHomeAssets.ts'

export const MOCK_ROUTE_DETAILS: Record<string, RouteDetailModel> = {
  ptychiouchos: {
    slug: 'ptychiouchos',
    name: 'Πτυχιούχος',
    fieldLabel: 'Κύριο Πεδίο - Metropolis',
    mountainLabel: 'Κλεισούρα',
    difficultyLabel: '6C',
    heroImageSrc: APP_HOME_ASSETS.categoryClimbing,
    showHeroImage: false,
    showHistorySidebarLink: false,
    showReviewsCommunityBadge: false,
    basics: [
      { label: 'ΔΙΑΔΡΟΜΗ', value: 'Πτυχιούχος' },
      { label: 'ΠΕΔΙΟ', value: 'Κύριο Πεδίο - Metropolis' },
      { label: 'ΒΟΥΝΟ / ΠΕΡΙΟΧΗ', value: 'Κλεισούρα' },
    ],
    technical: [
      { label: 'ΚΛΙΜΑΚΑ ΔΥΣΚΟΛΙΑΣ', value: 'Γαλλική' },
      { label: 'ΒΑΘΜΟΣ', value: '6C' },
      { label: 'ΥΨΟΜΕΤΡΟ (M)', value: '720' },
      { label: 'ΑΝΑΠΤΥΓΜΑ ΔΙΑΔΡΟΜΗΣ (M)', value: '25' },
    ],
    userReviews: [
      {
        memberLabel: 'Μαρία Κ.',
        dateLabel: '18/04/2025',
        comment:
          'Πολύ καθαρή πλάκα στο μεσαίο τμήμα· το τελείωμα απαιτεί ψυχραιμία. Συνιστώ έλεγχο πριν την πρώτη προσπάθεια της ημέρας.',
      },
      {
        memberLabel: 'Νίκος Π.',
        dateLabel: '02/03/2025',
        comment: 'Κλασική γραμμή του Metropolis — καλή ορατότητα σχοινοσυντρόφου και σταθερά πατήματα για το βαθμό.',
      },
      {
        memberLabel: 'Ελένη Δ.',
        dateLabel: '10/11/2024',
        comment: 'Μετά από βροχή υπήρχαν χαλαρά κομμάτια στο μέσο· χρήσιμο να τα ελέγξετε πριν την ανάβαση.',
      },
    ],
    sidebar: {
      title: 'Βαθμός Δυσκολίας',
      value: '6C',
      footnote: 'Γαλλική κλίμακα · κλασική αναρρίχηση',
    },
  },
}

export function getRouteDetailBySlug(slug: string): RouteDetailModel | undefined {
  return MOCK_ROUTE_DETAILS[slug]
}
