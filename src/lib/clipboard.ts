/** Preserve the reader's focus and selection when falling back on HTTP previews. */
export async function copyText(text: string): Promise<boolean> {
  try {
    await navigator.clipboard.writeText(text)
    return true
  } catch {
    const active = document.activeElement
    const selection = getSelection()
    const ranges = selection
      ? Array.from({ length: selection.rangeCount }, (_, i) =>
          selection.getRangeAt(i).cloneRange(),
        )
      : []
    const field = document.createElement("textarea")
    field.value = text
    field.readOnly = true
    field.style.cssText =
      "position:fixed;inset:0 auto auto 0;opacity:0;pointer-events:none"
    document.body.append(field)
    field.select()
    let copied = false
    try {
      copied = document.execCommand("copy")
    } catch {
      // Report failure in the UI rather than claiming a successful copy.
    } finally {
      field.remove()
      if (active instanceof HTMLElement) active.focus({ preventScroll: true })
      selection?.removeAllRanges()
      for (const range of ranges) selection?.addRange(range)
    }
    return copied
  }
}
