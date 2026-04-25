type Props = {
  label: string
}

export function AuthDividerWithLabel({ label }: Props) {
  return (
    <div className="relative py-2">
      <div className="absolute inset-0 flex items-center" aria-hidden>
        <div className="w-full border-t border-[#e2e8e0]" />
      </div>
      <div className="relative flex justify-center">
        <span className="bg-white px-3 text-xs font-medium lowercase text-[#94a3b8]">{label}</span>
      </div>
    </div>
  )
}
