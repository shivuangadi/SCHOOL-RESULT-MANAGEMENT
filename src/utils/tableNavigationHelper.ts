/**
 * Universal Keyboard Navigation Utility for School Result Management System
 * Allows teachers to navigate marks entry forms and tabular reports using:
 * - Enter: Move to the NEXT IMMEDIATE LINE in the same column (FA1 -> FA2 -> SA1 -> FA3 -> FA4 -> SA2 -> Total -> Next Student)
 * - ArrowDown: Move to the input directly below in the same column
 * - ArrowUp: Move to the input directly above in the same column
 * - ArrowRight: Move to the next input in the same row
 * - ArrowLeft: Move to the previous input in the same row
 */

export const handleTableGridNavigation = (e: React.KeyboardEvent<HTMLElement> | KeyboardEvent): void => {
  try {
    const { key } = e;
    if (!['Enter', 'ArrowDown', 'ArrowUp', 'ArrowLeft', 'ArrowRight'].includes(key)) {
      return;
    }

    const target = (e.target || document.activeElement) as HTMLElement;
    if (!target || !(target instanceof HTMLInputElement || target instanceof HTMLSelectElement)) {
      return;
    }

    // Allow native select interaction with Up/Down unless Alt or Ctrl key is pressed
    if (target instanceof HTMLSelectElement && (key === 'ArrowUp' || key === 'ArrowDown')) {
      if (!e.altKey && !e.ctrlKey) return;
    }

    // For text inputs with long text, allow cursor navigation unless at boundaries or all selected
    if (target instanceof HTMLInputElement && target.type === 'text' && target.value.length > 2) {
      const { selectionStart, selectionEnd, value } = target;
      if (selectionStart !== null && selectionEnd !== null && selectionStart === selectionEnd) {
        if (key === 'ArrowRight' && selectionStart < value.length) return;
        if (key === 'ArrowLeft' && selectionStart > 0) return;
      }
    }

    // Search within report container or nearest table/form
    const rootContainer =
      target.closest('.cce-page4-bw') ||
      target.closest('.cce-page4-mu-bw') ||
      target.closest('.cce-9line-sheet') ||
      target.closest('.report-page-sheet') ||
      target.closest('table') ||
      document.body;

    // Collect all visible interactive inputs and selects
    const allCandidates = Array.from(
      rootContainer.querySelectorAll<HTMLInputElement | HTMLSelectElement>(
        'input:not([disabled]):not([type="hidden"]):not([type="button"]):not([type="submit"]), select:not([disabled])'
      )
    ).filter((el) => {
      if (
        el.classList.contains('cce-pdf-text') ||
        el.classList.contains('hidden') ||
        el.classList.contains('print:hidden') ||
        el.classList.contains('no-print') ||
        el.disabled ||
        el.type === 'hidden'
      ) {
        return false;
      }
      const rect = el.getBoundingClientRect();
      return rect.width > 0 && rect.height > 0;
    });

    if (allCandidates.length <= 1) return;

    const targetRect = target.getBoundingClientRect();
    const targetCenterX = targetRect.left + targetRect.width / 2;

    const focusAndSelect = (input: HTMLElement | null): boolean => {
      if (!input) return false;
      input.focus();
      if (input instanceof HTMLInputElement && !['checkbox', 'radio', 'button'].includes(input.type)) {
        try {
          input.select();
        } catch (_) {}
      }
      return true;
    };

    // =========================================================================
    // 1. ENTER KEY & ARROW DOWN: Move to the NEXT IMMEDIATE LINE in the same column
    // =========================================================================
    if (key === 'Enter' || key === 'ArrowDown') {
      e.preventDefault();

      // Find all candidates strictly below target
      const below = allCandidates.filter((cand) => {
        if (cand === target) return false;
        const r = cand.getBoundingClientRect();
        return r.top >= targetRect.bottom - 4 || r.top > targetRect.top + 5;
      });

      if (below.length > 0) {
        // Find the closest row below
        const minTop = Math.min(...below.map((c) => c.getBoundingClientRect().top));
        // Group candidates in this immediate next line (within 12px)
        const nextRowCandidates = below.filter((c) => c.getBoundingClientRect().top <= minTop + 12);

        // Pick the one closest to target horizontal center (same column)
        nextRowCandidates.sort((a, b) => {
          const rA = a.getBoundingClientRect();
          const rB = b.getBoundingClientRect();
          const distA = Math.abs(rA.left + rA.width / 2 - targetCenterX);
          const distB = Math.abs(rB.left + rB.width / 2 - targetCenterX);
          return distA - distB;
        });

        if (focusAndSelect(nextRowCandidates[0])) return;
      }

      // If at bottom, wrap to next candidate in DOM order
      const currIdx = allCandidates.indexOf(target);
      if (currIdx >= 0 && currIdx < allCandidates.length - 1) {
        focusAndSelect(allCandidates[currIdx + 1]);
      } else if (allCandidates.length > 0) {
        // Wrap to the top
        focusAndSelect(allCandidates[0]);
      }
      return;
    }

    // =========================================================================
    // 2. ARROW UP: Move to the IMMEDIATE LINE ABOVE in the same column
    // =========================================================================
    if (key === 'ArrowUp') {
      e.preventDefault();

      // Find all candidates strictly above target
      const above = allCandidates.filter((cand) => {
        if (cand === target) return false;
        const r = cand.getBoundingClientRect();
        return r.bottom <= targetRect.top + 4 || r.top < targetRect.top - 5;
      });

      if (above.length > 0) {
        // Find the highest top (closest to target)
        const maxTop = Math.max(...above.map((c) => c.getBoundingClientRect().top));
        // Group candidates in this immediate row above (within 12px)
        const prevRowCandidates = above.filter((c) => c.getBoundingClientRect().top >= maxTop - 12);

        // Pick the one closest to target horizontal center (same column)
        prevRowCandidates.sort((a, b) => {
          const rA = a.getBoundingClientRect();
          const rB = b.getBoundingClientRect();
          const distA = Math.abs(rA.left + rA.width / 2 - targetCenterX);
          const distB = Math.abs(rB.left + rB.width / 2 - targetCenterX);
          return distA - distB;
        });

        if (focusAndSelect(prevRowCandidates[0])) return;
      }

      // If at top, fallback to previous candidate in DOM order
      const currIdx = allCandidates.indexOf(target);
      if (currIdx > 0) {
        focusAndSelect(allCandidates[currIdx - 1]);
      }
      return;
    }

    // =========================================================================
    // 3. ARROW RIGHT: Move immediately to the next input to the right
    // =========================================================================
    if (key === 'ArrowRight') {
      e.preventDefault();

      // Find candidates in the same horizontal row (within 14px vertically) to the right
      const rightSameRow = allCandidates.filter((cand) => {
        if (cand === target) return false;
        const r = cand.getBoundingClientRect();
        return Math.abs(r.top - targetRect.top) <= 14 && r.left >= targetRect.right - 4;
      });

      if (rightSameRow.length > 0) {
        rightSameRow.sort((a, b) => a.getBoundingClientRect().left - b.getBoundingClientRect().left);
        if (focusAndSelect(rightSameRow[0])) return;
      }

      // Fallback: next candidate in DOM order
      const currIdx = allCandidates.indexOf(target);
      if (currIdx >= 0 && currIdx < allCandidates.length - 1) {
        focusAndSelect(allCandidates[currIdx + 1]);
      }
      return;
    }

    // =========================================================================
    // 4. ARROW LEFT: Move immediately to the previous input to the left
    // =========================================================================
    if (key === 'ArrowLeft') {
      e.preventDefault();

      // Find candidates in the same horizontal row (within 14px vertically) to the left
      const leftSameRow = allCandidates.filter((cand) => {
        if (cand === target) return false;
        const r = cand.getBoundingClientRect();
        return Math.abs(r.top - targetRect.top) <= 14 && r.right <= targetRect.left + 4;
      });

      if (leftSameRow.length > 0) {
        leftSameRow.sort((a, b) => b.getBoundingClientRect().right - a.getBoundingClientRect().right);
        if (focusAndSelect(leftSameRow[0])) return;
      }

      // Fallback: previous candidate in DOM order
      const currIdx = allCandidates.indexOf(target);
      if (currIdx > 0) {
        focusAndSelect(allCandidates[currIdx - 1]);
      }
      return;
    }
  } catch (err) {
    console.warn('Keyboard navigation error handled:', err);
  }
};

// Global keydown listener so navigation works on all tables without requiring manual onKeyDown everywhere
if (typeof window !== 'undefined') {
  window.addEventListener('keydown', (e) => {
    const target = e.target as HTMLElement;
    if (
      target &&
      (target instanceof HTMLInputElement || target instanceof HTMLSelectElement) &&
      (target.closest('table') || target.closest('.report-page-sheet') || target.closest('.cce-9line-sheet'))
    ) {
      if (['Enter', 'ArrowDown', 'ArrowUp', 'ArrowLeft', 'ArrowRight'].includes(e.key)) {
        handleTableGridNavigation(e);
      }
    }
  });
}
