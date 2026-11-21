/**
 * Let the back gesture close a modal overlay instead of leaving the page.
 * Call the returned `opened()` right after showing the dialog. Call
 * `forget()` before the overlay navigates somewhere itself, so closing it
 * doesn't also step back in history.
 */
export function closeOnBack(
  dialog: HTMLDialogElement,
  close = () => dialog.close(),
) {
  let pushed = false

  addEventListener("popstate", () => {
    if (!pushed) return
    pushed = false
    if (dialog.open) close()
  })

  dialog.addEventListener("close", () => {
    if (!pushed) return
    pushed = false
    history.back()
  })

  return {
    opened() {
      if (pushed) return
      history.pushState(history.state, "")
      pushed = true
    },
    forget() {
      pushed = false
    },
  }
}
