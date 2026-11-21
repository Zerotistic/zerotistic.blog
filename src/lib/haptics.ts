/**
 * A tiny tap on touch devices, always paired with a visible change, used
 * sparingly: copy succeeded, theme switched. Nothing on scroll, load or the
 * companions. Call it synchronously from the click handler; iOS drops a
 * haptic that arrives after the gesture.
 */
const touch = matchMedia("(pointer: coarse)")
const reducedMotion = matchMedia("(prefers-reduced-motion: reduce)")

const patterns = {
  light: [8],
  success: [8, 60, 8],
} as const

let iosSwitch: HTMLLabelElement | undefined

export function haptic(kind: keyof typeof patterns = "light") {
  if (!touch.matches || reducedMotion.matches) return
  if ("vibrate" in navigator) {
    navigator.vibrate([...patterns[kind]])
    return
  }
  // Safari has no Vibration API, but flipping a native switch control plays
  // the system haptic (iOS 17.4+). The control is invisible and inert.
  if (!iosSwitch) {
    iosSwitch = document.createElement("label")
    iosSwitch.setAttribute("aria-hidden", "true")
    iosSwitch.style.cssText =
      "position:fixed;inset:0 auto auto 0;inline-size:1px;block-size:1px;opacity:0;pointer-events:none;overflow:hidden"
    const input = document.createElement("input")
    input.type = "checkbox"
    input.tabIndex = -1
    input.setAttribute("switch", "")
    iosSwitch.append(input)
    document.body.append(iosSwitch)
  }
  iosSwitch.click()
}
