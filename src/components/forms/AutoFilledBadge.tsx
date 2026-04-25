/** Small "autofill" pill beside fields populated from a route (`self-start` avoids stretch in `flex-col` parents). */
export function AutoFilledBadge() {
  return (
    <span className="inline-flex w-max max-w-full shrink-0 self-start items-center rounded-full bg-[#d1fae5] px-3 py-1 text-xs font-semibold uppercase tracking-wide text-[#047857]">
      ΑΥΤΟΜΑΤΗ ΣΥΜΠΛΗΡΩΣΗ
    </span>
  )
}
