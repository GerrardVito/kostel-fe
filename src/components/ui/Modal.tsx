import { useEffect, type ReactNode } from "react";
import { createPortal } from "react-dom";
import { X } from "lucide-react";

type ModalSize = "sm" | "md" | "lg" | "xl";

const sizeClasses: Record<ModalSize, string> = {
  sm: "max-w-sm",
  md: "max-w-md",
  lg: "max-w-lg",
  xl: "max-w-xl",
};

interface ModalProps {
  onClose: () => void;
  title?: ReactNode;
  children: ReactNode;
  footer?: ReactNode;
  size?: ModalSize;
  bodyClassName?: string;
}

function ModalContent({ onClose, title, children, footer, size = "md", bodyClassName }: ModalProps) {
  useEffect(() => {
    const onKeyDown = (e: KeyboardEvent) => {
      if (e.key === "Escape") onClose();
    };
    document.addEventListener("keydown", onKeyDown);
    const previousOverflow = document.body.style.overflow;
    document.body.style.overflow = "hidden";
    return () => {
      document.removeEventListener("keydown", onKeyDown);
      document.body.style.overflow = previousOverflow;
    };
  }, [onClose]);

  return (
    <div className="fixed inset-0 z-50 font-sans">
      {/* Backdrop — fixed to viewport, independent of any parent */}
      <div
        className="fixed inset-0 bg-black/40 backdrop-blur-sm animate-fade-in"
        onClick={onClose}
        aria-hidden="true"
      />
      {/* Centering layer — also fixed to viewport.
          overflow-y-auto lets it scroll when the panel exceeds the viewport.
          p-2 on mobile / p-4 on sm+ keeps the panel off screen edges. */}
      <div className="fixed inset-0 z-50 overflow-y-auto p-2 sm:p-4">
        {/* Flex centering inside the scroll layer */}
        <div className="flex min-h-full justify-center pt-6 sm:items-center sm:pt-0">
          <div
            role="dialog"
            aria-modal="true"
            className={`relative w-full ${sizeClasses[size]} bg-white rounded-2xl shadow-xl border border-slate-200 animate-scale-up flex flex-col max-h-[90dvh] overflow-hidden`}
          >
            {title !== undefined && (
              <div className="flex items-center justify-between gap-4 px-4 sm:px-6 py-3 sm:py-4 border-b border-slate-100 shrink-0">
                <h3 className="font-display font-bold text-base sm:text-lg text-slate-900">{title}</h3>
                <button
                  type="button"
                  onClick={onClose}
                  aria-label="Close"
                  className="p-1 text-slate-400 hover:text-slate-600 rounded-full cursor-pointer transition-colors"
                >
                  <X className="w-5 h-5" />
                </button>
              </div>
            )}

            <div className={`overflow-y-auto grow ${bodyClassName ?? "px-4 sm:px-6 pt-4 sm:pt-5 pb-4 sm:pb-5"}`}>{children}</div>

            {footer !== undefined && (
              <div className="px-4 sm:px-6 py-3 sm:py-4 border-t border-slate-100 bg-white shrink-0">{footer}</div>
            )}
          </div>
        </div>
      </div>
    </div>
  );
}

export default function Modal(props: ModalProps) {
  return createPortal(<ModalContent {...props} />, document.body);
}
