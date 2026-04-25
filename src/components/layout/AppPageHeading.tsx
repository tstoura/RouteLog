/**
 * Shared app page heading: large #00453e title, green accent bar, optional subtitle.
 */
export function AppPageHeading({ title, description }: { title: string; description?: string }) {
  return (
    <header className="space-y-2">
      <h1 className="font-heading text-4xl font-extrabold tracking-tight text-[#00453e] md:text-5xl md:leading-[48px] md:tracking-[-1.2px]">
        {title}
      </h1>
      <div className="h-1 w-20 rounded-full bg-[#005f56]" aria-hidden />
      {description ? <p className="pt-1 text-lg text-[#4c616c]">{description}</p> : null}
    </header>
  )
}
