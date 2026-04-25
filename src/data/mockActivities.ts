import type { ActivityDetailModel } from '../types/activityDetail.ts'

export const ROUTES_SAME_FIELD_DEEP_LINK = '/app/routes?category=climbing&field=metropolis'

/** Activity detail payloads keyed by slug (extend over time). */
export const MOCK_ACTIVITY_DETAILS: Record<string, ActivityDetailModel> = {
  ptychiouchos: {
    slug: 'ptychiouchos',
    title: 'Πτυχιούχος',
    kind: 'rock_climbing',
    historyCardId: 'a2',
    fieldLabel: 'Κύριο Πεδίο - Metropolis',
    mountainLabel: 'Κλεισούρα',
    dateLabel: '15/05/2026',
    styleBadge: 'RED POINT',
    status: 'official',
    basics: [
      { label: 'ΗΜΕΡΟΜΗΝΙΑ', value: '15/05/2025' },
      { label: 'ΠΕΔΙΟ', value: 'Κύριο Πεδίο - Metropolis' },
      { label: 'ΒΟΥΝΟ', value: 'Κλεισούρα' },
      { label: 'ΕΠΟΧΗ', value: 'Θερινή' },
      { label: 'ΚΑΤΑΣΤΑΣΗ', value: 'Επανάληψη' },
    ],
    technical: [
      { label: 'ΚΛΙΜΑΚΑ ΔΥΣΚΟΛΙΑΣ', value: 'Γαλλική' },
      { label: 'ΒΑΘΜΟΣ ΔΥΣΚΟΛΙΑΣ', value: '6c' },
      { label: 'ΜΙΚΤΑ', value: '—' },
      { label: 'ΥΨΟΜΕΤΡΟ (M)', value: '—' },
      { label: 'ΑΝΑΠΤΥΓΜΑ ΔΙΑΔΡΟΜΗΣ (M)', value: '25' },
    ],
    participation: {
      peopleCount: 2,
      peopleLabel: 'Συνολική Ομάδα',
      partners: ['Νίκος Π.', 'Μαρία Κ.'],
    },
    personalNote: {
      body: 'Ξεκινήσαμε νωρίς το πρωί για να προλάβουμε τη ζέστη. Η διαδρομή σε γενικές γραμμές καθαρή, με καλά πατήματα στο κρίσιμο σημείο. Η σκιά του βράχου βοήθησε στα τελευταία μέτρα.',
    },
    routeEvaluation: {
      body: 'Προσοχή σε χαλαρά κομμάτια στο μέσο της διαδρομής — χρήσιμο να ελέγχετε πριν την ανάβαση. Γενικά πολύ καλή ποιότητα βράχου και σαφή πατήματα για το βαθμό.',
    },
    sidebar: {
      scoreTitle: 'ΥΠΟΛΟΓΙΣΜΕΝΟΙ ΒΑΘΜΟΙ',
      scoreValue: '350',
      scoreFootnote: 'Βασισμένο στη δυσκολία 6c',
    },
    routesDeepLink: ROUTES_SAME_FIELD_DEEP_LINK,
  },
}

export function getActivityDetailBySlug(slug: string): ActivityDetailModel | undefined {
  return MOCK_ACTIVITY_DETAILS[slug]
}
